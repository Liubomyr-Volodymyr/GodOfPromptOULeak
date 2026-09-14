import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';
import { MinioMlflowService } from 'src/modules/minio/services/minio-mlflow.service';

@Injectable()
export class MLflowService implements OnModuleInit {
	private mlflow: any;
	private experimentId: string;
	private isInitialized = false;
	private readonly mlflowApiUrl: string;

	constructor(private readonly minioMlflowService: MinioMlflowService) {
		this.mlflowApiUrl = process.env.MLFLOW_TRACKING_URI;

		if (!this.mlflowApiUrl) {
			console.error('ERROR: MLFLOW_TRACKING_URI is not set');
			return;
		}
	}

	async onModuleInit() {
		if (!this.mlflowApiUrl) {
			console.error('MLflow tracking URI is not set');
			return;
		}

		try {
			const { default: Mlflow } = await import('mlflow-js');
			this.mlflow = new Mlflow(this.mlflowApiUrl);

			if (process.env.NODE_ENV !== 'local') {
				await this.initializeExperiment();
				console.log('+ MLflow service fully initialized');
			}
		} catch (error) {
			console.error('- Failed to initialize MLflow experiment:', error);
		}
	}

	private async initializeExperiment(): Promise<void> {
		const experimentName = 'ai_interactions';

		try {
			const getResponse = await this.makeRequest(
				'get',
				`${this.mlflowApiUrl}/api/2.0/mlflow/experiments/get-by-name?experiment_name=${experimentName}`,
			);

			if (getResponse.data && getResponse.data.experiment) {
				this.experimentId = getResponse.data.experiment.experiment_id;
				this.isInitialized = true;
				return;
			}
		} catch (error) {
			console.error(error);
			try {
				const createResponse = await this.makeRequest(
					'post',
					`${this.mlflowApiUrl}/api/2.0/mlflow/experiments/create`,
					{ name: experimentName },
				);

				this.experimentId = createResponse.data.experiment_id;
				this.isInitialized = true;
				console.log(
					`+ MLflow experiment created with ID: ${this.experimentId}`,
				);
				return;
			} catch (createError) {
				console.error(
					'Failed to create MLflow experiment:',
					createError,
				);
				throw createError;
			}
		}
	}

	async logAIInteraction(
		model: string,
		prompt: string,
		response: string,
		project_key: string,
		metadata: Record<string, unknown> = {},
	): Promise<string | undefined> {
		if (!this.isInitialized || !this.experimentId) {
			try {
				await this.initializeExperiment();
			} catch (error) {
				console.error(error);
				return undefined;
			}

			if (!this.experimentId) {
				return undefined;
			}
		}

		try {
			const responseTime = (metadata.responseTime as number) || 0;
			const endTime = Date.now();
			const startTime = endTime - responseTime;

			const runName = `${model}_${startTime}`;
			const runResponse = await this.makeRequest(
				'post',
				`${this.mlflowApiUrl}/api/2.0/mlflow/runs/create`,
				{
					experiment_id: this.experimentId,
					run_name: runName,
					start_time: startTime,
				},
			);
			const runId = runResponse.data.run.info.run_uuid;

			await Promise.all([
				this.addTag(runId, 'model', model),
				this.addTag(runId, 'project_key', project_key),
				this.addTag(
					runId,
					'model_type',
					model.includes('asst') ? 'assistant' : 'llm',
				),
				this.logParam(runId, 'model', model),
				this.logParam(runId, 'timestamp', new Date().toISOString()),
			]);

			const promptTokens = this.estimateTokens(prompt);
			const responseTokens = this.estimateTokens(response);
			const timestamp = Date.now();

			await Promise.all([
				this.logMetric(runId, 'prompt_tokens', promptTokens, timestamp),
				this.logMetric(
					runId,
					'response_tokens',
					responseTokens,
					timestamp,
				),
				this.logMetric(
					runId,
					'response_time_ms',
					responseTime,
					timestamp,
				),
			]);

			const [promptUrl, responseUrl] = await Promise.all([
				this.minioMlflowService.upload(
					`${runId}/prompt.txt`,
					Buffer.from(prompt),
				),
				this.minioMlflowService.upload(
					`${runId}/response.txt`,
					Buffer.from(response),
				),
			]);

			await Promise.all([
				this.logParam(runId, 'prompt_url', promptUrl),
				this.logParam(runId, 'response_url', responseUrl),
			]);

			await this.terminateRun(runId, endTime);

			return runId;
		} catch (error) {
			console.error(error);
			return undefined;
		}
	}

	private async makeRequest(
		method: 'get' | 'post',
		url: string,
		data?: any,
	): Promise<any> {
		const config: any = {};

		if (method === 'get') {
			return axios.get(url, config);
		} else {
			return axios.post(url, data, config);
		}
	}

	private async terminateRun(runId: string, endTime: number): Promise<void> {
		try {
			await this.makeRequest(
				'post',
				`${this.mlflowApiUrl}/api/2.0/mlflow/runs/update`,
				{
					run_id: runId,
					status: 'FINISHED',
					end_time: endTime,
				},
			);
		} catch (error) {
			console.error(error);
		}
	}

	private async logParam(
		runId: string,
		key: string,
		value: string,
	): Promise<void> {
		try {
			await this.makeRequest(
				'post',
				`${this.mlflowApiUrl}/api/2.0/mlflow/runs/log-parameter`,
				{
					run_id: runId,
					key,
					value,
				},
			);
		} catch (error) {
			console.error(error);
		}
	}

	private async logMetric(
		runId: string,
		key: string,
		value: number,
		timestamp: number,
	): Promise<void> {
		try {
			await this.makeRequest(
				'post',
				`${this.mlflowApiUrl}/api/2.0/mlflow/runs/log-metric`,
				{
					run_id: runId,
					key,
					value,
					timestamp,
					step: 0,
				},
			);
		} catch (error) {
			console.error(error);
		}
	}

	private estimateTokens(text: string | object | unknown): number {
		const stringContent =
			typeof text === 'string' ? text : JSON.stringify(text);
		return Math.ceil(stringContent.length / 4);
	}

	private async addTag(
		runId: string,
		key: string,
		value: string,
	): Promise<void> {
		try {
			await this.makeRequest(
				'post',
				`${this.mlflowApiUrl}/api/2.0/mlflow/runs/set-tag`,
				{
					run_id: runId,
					key,
					value,
				},
			);
		} catch (error) {
			console.error(error);
		}
	}
}
