export const users = {
  developers: new Set(["910837428862984213"]),

  isDeveloper(id: string) {
    return this.developers.has(id);
  },
};
