declare module 'compromise' {
  const nlp: any;
  export default nlp;
}

declare module 'natural' {
  const natural: any;
  export default natural;
}

declare module 'stopword' {
  const stopword: { removeStopwords: (tokens: string[], stopwords?: string[]) => string[] };
  export default stopword;
}


