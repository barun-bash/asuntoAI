/** Tiny template helper: tpl("{n} riskilippua", { n: 3 }).
   Lives in lib (not the client provider) so server modules — OG metadata,
   emails — share the same interpolation as the UI. */
export function tpl(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
