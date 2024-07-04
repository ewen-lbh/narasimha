// To parse this data:
//
//   import { Convert, Config } from "./file";
//
//   const config = Convert.toConfig(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Config {
    /**
     * Branding information for the API
     */
    branding: Branding;
    /**
     * HTML to insert at the bottom of every page
     */
    footer?: string;
    /**
     * Categorize your schema's items. If not specified, all items will be displayed in a single
     * module
     */
    modules?: Modules;
    /**
     * Directory to look for additional documentation pages, as markdown or MDSveX files. The
     * final URL will be the path to the markdown file relative to the value of `pages`, without
     * the `.md` extension. For example, with `pages: ./docs`, a page defined in
     * `./docs/foo/bar.md` will be available at `/foo/bar`. Files are copied at build time into
     * the template code at `src/routes/(path to file without extension)/+page.mdsvex`. If the
     * filename is prefix with a `+`, it'll be copied in src/routes directly (not in a
     * subdirectory)
     */
    pages: string;
    /**
     * A path or URL to a graphl schema file, or configuration for introspection
     */
    schema: SchemaClass | string;
    /**
     * Directory to look for additional static files that will be copied to the template's
     * `static` directory, to be served at the root of the website
     */
    static: string;
    /**
     * Degit repository specifier to use as the website template. Defaults to Graphinx's default
     * template.
     * See [degit's documentation](https://www.npmjs.com/package/degit#basics) for more
     * information. The only difference is that the default branch name is "main" instead of
     * master (i.e. use  `...#master` to clone the master branch, and `...#main` is not needed)
     *
     * Basic syntax:
     *
     * - `owner/repo`: a GitHub repository
     * - `owner/repo#branch`: a specific branch of a GitHub repository
     * - `owner/repo#tag`: a specific tag of a GitHub repository
     * - `owner/repo#commit`: a specific commit of a GitHub repository
     * - `owner/repo/folder`: a subfolder of a GitHub repository. Also supports #branch, #tag,
     * and #commit
     * - `https://example.com/...`: same as above, but for any Git repository
     */
    template?: string;
}

/**
 * Branding information for the API
 */
export interface Branding {
    /**
     * Path or URL to the API's logo
     */
    logo: string;
    /**
     * Name of the API
     */
    name: string;
}

/**
 * Categorize your schema's items. If not specified, all items will be displayed in a single
 * module
 */
export interface Modules {
    /**
     * Auto-categorize using your API's source code tree. Every value in here can use %module%,
     * which will be replaced by the module we are currently checking.
     */
    filesystem?: Filesystem;
    /**
     * Configure the "index" module, that contains every schema item. Set this to false, or
     * remove it, to disable the index module. Set to true to enable it, with default values
     */
    index?: boolean | IndexClass;
    /**
     * Manually declare modules.
     */
    static?: Static[];
}

/**
 * Auto-categorize using your API's source code tree. Every value in here can use %module%,
 * which will be replaced by the module we are currently checking.
 */
export interface Filesystem {
    /**
     * Path or URL to an icon for the module
     */
    icon?: string;
    /**
     * Path to a markdown file describing the module. The first paragraph will serve as the
     * short description, while the <h1>'s content will serve as the module's display name
     */
    intro: string;
    /**
     * How to know that a given schema item (a type, a query, a mutation, etc.) should belong to
     * that module?
     */
    items: Item[];
    /**
     * How to get the modules' names?
     */
    names?: Names;
    /**
     * Order in which to display the modules. If a module is not
     * listed here, it will be displayed at the end. If not specified, the order is alphabetical
     */
    order?: string[];
}

export interface Item {
    /**
     * URL to use for the "contribute" button for that item. Available placeholders are:
     *
     * - %module%,
     * - %name%, the item's name
     * - %path%, the path to the file that matched
     *
     * If the value is not specified, the "contribute" button will not be displayed
     */
    contribution?: string;
    /**
     * Glob pattern of file paths to search in
     */
    files: string;
    /**
     * Regular expressions that will be tried for every file found in `files`. The regexp must
     * define a named capture group named `name`. A given GraphQL Schema item will be considered
     * as part of that module if a line of any file as specified by `files` matches this regular
     * expression, with the capture group named `name` having as value the GraphQL schema type's
     * name.
     */
    match: string;
}

/**
 * How to get the modules' names?
 */
export interface Names {
    /**
     * Directory to look for modules. The modules' names will be
     * the name of all the sub-directories in this directory
     */
    in?: string;
    /**
     * Explicitly list the modules' names
     */
    is?: string[];
}

export interface IndexClass {
    /**
     * A Markdown-formatted text describing the index module
     */
    description?: string;
    /**
     * Display name of the index module
     */
    title?: string;
}

export interface Static {
    /**
     * Path or URL to an icon for the module
     */
    icon?: string;
    /**
     * A Markdown-formatted text describing the module
     */
    intro: string;
    /**
     * List of schema item names that belong in that module
     */
    items: string[];
    /**
     * URL-friendly name of the module. Cannot be "index" (reserved for the index module)
     */
    name: string;
    /**
     * Display name of the module
     */
    title: string;
}

export interface SchemaClass {
    introspection: Introspection;
}

export interface Introspection {
    /**
     * Define headers to use when doing the POST request. For example, an authorization header
     */
    headers?: { [key: string]: string };
    /**
     * URL where to query the API to generate a schema via introspection
     */
    url: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toConfig(json: string): Config {
        return cast(JSON.parse(json), r("Config"));
    }

    public static configToJson(value: Config): string {
        return JSON.stringify(uncast(value, r("Config")), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) {}
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
            : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
            : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Config": o([
        { json: "branding", js: "branding", typ: r("Branding") },
        { json: "footer", js: "footer", typ: u(undefined, "") },
        { json: "modules", js: "modules", typ: u(undefined, r("Modules")) },
        { json: "pages", js: "pages", typ: "" },
        { json: "schema", js: "schema", typ: u(r("SchemaClass"), "") },
        { json: "static", js: "static", typ: "" },
        { json: "template", js: "template", typ: u(undefined, "") },
    ], false),
    "Branding": o([
        { json: "logo", js: "logo", typ: "" },
        { json: "name", js: "name", typ: "" },
    ], false),
    "Modules": o([
        { json: "filesystem", js: "filesystem", typ: u(undefined, r("Filesystem")) },
        { json: "index", js: "index", typ: u(undefined, u(true, r("IndexClass"))) },
        { json: "static", js: "static", typ: u(undefined, a(r("Static"))) },
    ], false),
    "Filesystem": o([
        { json: "icon", js: "icon", typ: u(undefined, "") },
        { json: "intro", js: "intro", typ: "" },
        { json: "items", js: "items", typ: a(r("Item")) },
        { json: "names", js: "names", typ: u(undefined, r("Names")) },
        { json: "order", js: "order", typ: u(undefined, a("")) },
    ], false),
    "Item": o([
        { json: "contribution", js: "contribution", typ: u(undefined, "") },
        { json: "files", js: "files", typ: "" },
        { json: "match", js: "match", typ: "" },
    ], false),
    "Names": o([
        { json: "in", js: "in", typ: u(undefined, "") },
        { json: "is", js: "is", typ: u(undefined, a("")) },
    ], false),
    "IndexClass": o([
        { json: "description", js: "description", typ: u(undefined, "") },
        { json: "title", js: "title", typ: u(undefined, "") },
    ], false),
    "Static": o([
        { json: "icon", js: "icon", typ: u(undefined, "") },
        { json: "intro", js: "intro", typ: "" },
        { json: "items", js: "items", typ: a("") },
        { json: "name", js: "name", typ: "" },
        { json: "title", js: "title", typ: "" },
    ], false),
    "SchemaClass": o([
        { json: "introspection", js: "introspection", typ: r("Introspection") },
    ], false),
    "Introspection": o([
        { json: "headers", js: "headers", typ: u(undefined, m("")) },
        { json: "url", js: "url", typ: "" },
    ], false),
};
