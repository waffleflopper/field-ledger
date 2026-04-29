export type ScaffoldHealth = {
  status: "ok";
  api: "trpc";
  queryClient: "tanstack-query";
  scope: "scaffold";
};

export function getScaffoldHealth(): ScaffoldHealth {
  return {
    status: "ok",
    api: "trpc",
    queryClient: "tanstack-query",
    scope: "scaffold",
  };
}
