export interface XAICitation {
  title: string;
  url: string;
  snippet?: string;
  id: string;
  [key: string]: any; // For any additional fields returned by xAI
}
