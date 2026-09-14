import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { QdrantSyncService } from './qdrant-sync.service';

interface SyncState {
	lastSyncAt: string | null;
}

@Injectable()
export class QdrantCronService {
	private readonly logger = new Logger(QdrantCronService.name);
	private readonly stateFilePath = path.join(process.cwd(), 'data', 'qdrant-sync-state.json');
	private isSyncing = false;

	constructor(private readonly qdrantSyncService: QdrantSyncService) {}

	@Cron(process.env.QDRANT_CRON_SCHEDULE || '0 2 * * *')
	async handleSync() {
		if (this.isSyncing) {
			this.logger.warn('Sync already in progress, skipping');
			return;
		}

		this.isSyncing = true;
		try {
			await this.runSync();
		} finally {
			this.isSyncing = false;
		}
	}

	private async runSync() {
		const state = this.readState();
		const syncStartedAt = new Date().toISOString();

		if (state.lastSyncAt) {
			this.logger.log(`Starting incremental sync from ${state.lastSyncAt}`);
		} else {
			this.logger.log('Starting full sync (no lastSyncAt)');
		}

		let page = 1;
		let totalSynced = 0;

		while (true) {
			const result = await this.qdrantSyncService.syncPrompts({
				limit: 100,
				page,
				dateUpdatedGte: state.lastSyncAt ?? undefined,
			});

			if (!result || result.length === 0) {
				break;
			}

			totalSynced += result.length;
			this.logger.log(`Synced page ${page} (${result.length} items)`);
			page++;
		}

		this.saveState({ lastSyncAt: syncStartedAt });
		this.logger.log(`Sync complete. Total synced: ${totalSynced}`);
	}

	private readState(): SyncState {
		try {
			if (fs.existsSync(this.stateFilePath)) {
				return JSON.parse(fs.readFileSync(this.stateFilePath, 'utf-8'));
			}
		} catch {
			// ignore parse errors — start fresh
		}
		return { lastSyncAt: null };
	}

	private saveState(state: SyncState) {
		fs.mkdirSync(path.dirname(this.stateFilePath), { recursive: true });
		fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2));
	}
}
