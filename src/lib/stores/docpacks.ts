import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

export interface Docpack {
	id: string; // Job ID from RunPod
	repoOwner: string;
	repoName: string;
	branch: string;
	status: 'queued' | 'processing' | 'completed' | 'failed';
	progress: number;
	createdAt: string;
	completedAt?: string;
	logs: string[];
	jsonlData: string[]; // Deprecated - keeping for backward compatibility
	errorMessage?: string;
	s3Key?: string; // R2/S3 key: "docpacks/{owner}/{repo}.docpack"
	docpackUrl?: string; // Public URL to download the .docpack file
}

interface DocpackStore {
	docpacks: Docpack[];
}

// Load from localStorage if in browser
function loadFromStorage(): DocpackStore {
	if (browser) {
		const stored = localStorage.getItem('docpacks');
		if (stored) {
			try {
				return JSON.parse(stored);
			} catch (e) {
				console.error('Failed to parse stored docpacks:', e);
			}
		}
	}
	return { docpacks: [] };
}

// Create the store
const createDocpackStore = () => {
	const { subscribe, set, update } = writable<DocpackStore>(loadFromStorage());

	// Save to localStorage whenever state changes
	subscribe((value) => {
		if (browser) {
			localStorage.setItem('docpacks', JSON.stringify(value));
		}
	});

	return {
		subscribe,

		// Add a new docpack (when job is started)
		add: (docpack: Docpack) => {
			update((store) => {
				// Check if docpack for this repo already exists
				const exists = store.docpacks.some(
					(d) => d.repoOwner === docpack.repoOwner && d.repoName === docpack.repoName
				);

				if (!exists) {
					return {
						docpacks: [...store.docpacks, docpack]
					};
				}
				return store;
			});
		},

		// Update a docpack by job ID
		update: (jobId: string, updates: Partial<Docpack>) => {
			update((store) => ({
				docpacks: store.docpacks.map((d) =>
					d.id === jobId ? { ...d, ...updates } : d
				)
			}));
		},

		// Add log to a docpack
		addLog: (jobId: string, log: string) => {
			update((store) => ({
				docpacks: store.docpacks.map((d) =>
					d.id === jobId ? { ...d, logs: [...d.logs, log] } : d
				)
			}));
		},

		// Add JSONL data to a docpack
		addJsonlData: (jobId: string, data: string) => {
			update((store) => ({
				docpacks: store.docpacks.map((d) =>
					d.id === jobId ? { ...d, jsonlData: [...d.jsonlData, data] } : d
				)
			}));
		},

		// Remove a docpack
		remove: (jobId: string) => {
			update((store) => ({
				docpacks: store.docpacks.filter((d) => d.id !== jobId)
			}));
		},

		// Check if a repo has a docpack
		hasDocpack: (owner: string, repo: string): boolean => {
			const store = get(docpackStore);
			return store.docpacks.some(
				(d) => d.repoOwner === owner && d.repoName === repo
			);
		},

		// Get docpack by job ID
		getById: (jobId: string): Docpack | undefined => {
			const store = get(docpackStore);
			return store.docpacks.find((d) => d.id === jobId);
		},

		// Get docpack for a specific repo
		getByRepo: (owner: string, repo: string): Docpack | undefined => {
			const store = get(docpackStore);
			return store.docpacks.find(
				(d) => d.repoOwner === owner && d.repoName === repo
			);
		},

		// Clear all docpacks
		clear: () => {
			set({ docpacks: [] });
		}
	};
};

export const docpackStore = createDocpackStore();
