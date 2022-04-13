declare const getStripMode: (stripOption: boolean | 'false' | 'true', slimOption: boolean | 'false' | 'true', dockerizePip: boolean) => 'skip' | 'docker' | 'direct';
declare const getStripCommand: (options: any, folderPath: any) => any[];
