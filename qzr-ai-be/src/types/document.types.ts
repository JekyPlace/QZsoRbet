export type DocumentContext = {
  chunkIndex?: number;
  fileName?: string;
  page?: number;
  pointId?: number | string;
  rowStart?: number;
  rowEnd?: number;
  score: number;
  source: string;
  text: string;
  type?: "csv" | "pdf" | "wordpress";
};
