// lib/types.ts

export type Chunk = {
	id: string;
	text: string;
	source: string;
};

export type Retrieved = {
	id: string | number;
	text: string;
	source: string;
	score?: number;
};
