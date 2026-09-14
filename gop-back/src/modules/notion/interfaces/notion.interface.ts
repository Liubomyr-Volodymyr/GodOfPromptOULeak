export interface NotionPageProperties {
	Order: { type: 'number'; number: number };
	Name: { type: 'title'; title: { plain_text: string }[] };
	Model: { type: 'select'; select: { name: string } };
	Prompt: { type: 'rich_text'; rich_text: { plain_text: string }[] };
	Insert: { type: 'select'; select: { name: string } };
	Category: { type: 'select'; select: { name: string } };
	'Sub Category': { type: 'select'; select: { name: string } };
	Premium: { type: 'checkbox'; checkbox: boolean };
	Done: { type: 'checkbox'; checkbox: boolean };

	Attribution: { type: 'select'; select: { name: string } };
	'Plan Type': { type: 'select'; select: { name: string } };
}
