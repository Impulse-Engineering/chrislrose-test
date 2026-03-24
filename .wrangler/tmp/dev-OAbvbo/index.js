var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form2 = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form2[key] = value;
    } else {
      handleParsingAllValues(form2, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form2).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form2, key, value);
        delete form2[key];
      }
    });
  }
  return form2;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form2, key, value) => {
  if (form2[key] !== void 0) {
    if (Array.isArray(form2[key])) {
      ;
      form2[key].push(value);
    } else {
      form2[key] = [form2[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form2[key] = value;
    } else {
      form2[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form2, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form2;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var escapeRe = /[&<>'"]/;
var stringBufferToString = /* @__PURE__ */ __name(async (buffer, callbacks) => {
  let str = "";
  callbacks ||= [];
  const resolvedBuffer = await Promise.all(buffer);
  for (let i = resolvedBuffer.length - 1; ; i--) {
    str += resolvedBuffer[i];
    i--;
    if (i < 0) {
      break;
    }
    let r = resolvedBuffer[i];
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    const isEscaped = r.isEscaped;
    r = await (typeof r === "object" ? r.toString() : r);
    if (typeof r === "object") {
      callbacks.push(...r.callbacks || []);
    }
    if (r.isEscaped ?? isEscaped) {
      str += r;
    } else {
      const buf = [str];
      escapeToBuffer(r, buf);
      str = buf[0];
    }
  }
  return raw(str, callbacks);
}, "stringBufferToString");
var escapeToBuffer = /* @__PURE__ */ __name((str, buffer) => {
  const match2 = str.search(escapeRe);
  if (match2 === -1) {
    buffer[0] += str;
    return;
  }
  let escape;
  let index;
  let lastIndex = 0;
  for (index = match2; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escape = "&quot;";
        break;
      case 39:
        escape = "&#39;";
        break;
      case 38:
        escape = "&amp;";
        break;
      case 60:
        escape = "&lt;";
        break;
      case 62:
        escape = "&gt;";
        break;
      default:
        continue;
    }
    buffer[0] += str.substring(lastIndex, index) + escape;
    lastIndex = index + 1;
  }
  buffer[0] += str.substring(lastIndex, index);
}, "escapeToBuffer");
var resolveCallbackSync = /* @__PURE__ */ __name((str) => {
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return str;
  }
  const buffer = [str];
  const context = {};
  callbacks.forEach((c) => c({ phase: HtmlEscapedCallbackPhase.Stringify, buffer, context }));
  return buffer[0];
}, "resolveCallbackSync");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html2, arg, headers) => {
    const res = /* @__PURE__ */ __name((html22) => this.#newResponse(html22, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html2 === "object" ? resolveCallback(html2, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html2);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input2, requestInit, Env, executionCtx) => {
    if (input2 instanceof Request) {
      return this.fetch(requestInit ? new Request(input2, requestInit) : input2, Env, executionCtx);
    }
    input2 = input2.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input2) ? input2 : `http://localhost${mergePath("/", input2)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/jsx/constants.js
var DOM_RENDERER = /* @__PURE__ */ Symbol("RENDERER");
var DOM_ERROR_HANDLER = /* @__PURE__ */ Symbol("ERROR_HANDLER");
var DOM_INTERNAL_TAG = /* @__PURE__ */ Symbol("INTERNAL");
var PERMALINK = /* @__PURE__ */ Symbol("PERMALINK");

// node_modules/hono/dist/jsx/dom/utils.js
var setInternalTagFlag = /* @__PURE__ */ __name((fn) => {
  ;
  fn[DOM_INTERNAL_TAG] = true;
  return fn;
}, "setInternalTagFlag");

// node_modules/hono/dist/jsx/dom/context.js
var createContextProviderFunction = /* @__PURE__ */ __name((values) => ({ value, children }) => {
  if (!children) {
    return void 0;
  }
  const props = {
    children: [
      {
        tag: setInternalTagFlag(() => {
          values.push(value);
        }),
        props: {}
      }
    ]
  };
  if (Array.isArray(children)) {
    props.children.push(...children.flat());
  } else {
    props.children.push(children);
  }
  props.children.push({
    tag: setInternalTagFlag(() => {
      values.pop();
    }),
    props: {}
  });
  const res = { tag: "", props, type: "" };
  res[DOM_ERROR_HANDLER] = (err) => {
    values.pop();
    throw err;
  };
  return res;
}, "createContextProviderFunction");

// node_modules/hono/dist/jsx/context.js
var globalContexts = [];
var createContext = /* @__PURE__ */ __name((defaultValue) => {
  const values = [defaultValue];
  const context = /* @__PURE__ */ __name(((props) => {
    values.push(props.value);
    let string;
    try {
      string = props.children ? (Array.isArray(props.children) ? new JSXFragmentNode("", {}, props.children) : props.children).toString() : "";
    } catch (e) {
      values.pop();
      throw e;
    }
    if (string instanceof Promise) {
      return string.finally(() => values.pop()).then((resString) => raw(resString, resString.callbacks));
    } else {
      values.pop();
      return raw(string);
    }
  }), "context");
  context.values = values;
  context.Provider = context;
  context[DOM_RENDERER] = createContextProviderFunction(values);
  globalContexts.push(context);
  return context;
}, "createContext");
var useContext = /* @__PURE__ */ __name((context) => {
  return context.values.at(-1);
}, "useContext");

// node_modules/hono/dist/jsx/intrinsic-element/common.js
var deDupeKeyMap = {
  title: [],
  script: ["src"],
  style: ["data-href"],
  link: ["href"],
  meta: ["name", "httpEquiv", "charset", "itemProp"]
};
var domRenderers = {};
var dataPrecedenceAttr = "data-precedence";
var isStylesheetLinkWithPrecedence = /* @__PURE__ */ __name((props) => props.rel === "stylesheet" && "precedence" in props, "isStylesheetLinkWithPrecedence");
var shouldDeDupeByKey = /* @__PURE__ */ __name((tagName, supportSort) => {
  if (tagName === "link") {
    return supportSort;
  }
  return deDupeKeyMap[tagName].length > 0;
}, "shouldDeDupeByKey");

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var components_exports = {};
__export(components_exports, {
  button: () => button,
  form: () => form,
  input: () => input,
  link: () => link,
  meta: () => meta,
  script: () => script,
  style: () => style,
  title: () => title
});

// node_modules/hono/dist/jsx/children.js
var toArray = /* @__PURE__ */ __name((children) => Array.isArray(children) ? children : [children], "toArray");

// node_modules/hono/dist/jsx/intrinsic-element/components.js
var metaTagMap = /* @__PURE__ */ new WeakMap();
var insertIntoHead = /* @__PURE__ */ __name((tagName, tag, props, precedence) => ({ buffer, context }) => {
  if (!buffer) {
    return;
  }
  const map = metaTagMap.get(context) || {};
  metaTagMap.set(context, map);
  const tags = map[tagName] ||= [];
  let duped = false;
  const deDupeKeys = deDupeKeyMap[tagName];
  const deDupeByKey = shouldDeDupeByKey(tagName, precedence !== void 0);
  if (deDupeByKey) {
    LOOP: for (const [, tagProps] of tags) {
      if (tagName === "link" && !(tagProps.rel === "stylesheet" && tagProps[dataPrecedenceAttr] !== void 0)) {
        continue;
      }
      for (const key of deDupeKeys) {
        if ((tagProps?.[key] ?? null) === props?.[key]) {
          duped = true;
          break LOOP;
        }
      }
    }
  }
  if (duped) {
    buffer[0] = buffer[0].replaceAll(tag, "");
  } else if (deDupeByKey || tagName === "link") {
    tags.push([tag, props, precedence]);
  } else {
    tags.unshift([tag, props, precedence]);
  }
  if (buffer[0].indexOf("</head>") !== -1) {
    let insertTags;
    if (tagName === "link" || precedence !== void 0) {
      const precedences = [];
      insertTags = tags.map(([tag2, , tagPrecedence], index) => {
        if (tagPrecedence === void 0) {
          return [tag2, Number.MAX_SAFE_INTEGER, index];
        }
        let order = precedences.indexOf(tagPrecedence);
        if (order === -1) {
          precedences.push(tagPrecedence);
          order = precedences.length - 1;
        }
        return [tag2, order, index];
      }).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map(([tag2]) => tag2);
    } else {
      insertTags = tags.map(([tag2]) => tag2);
    }
    insertTags.forEach((tag2) => {
      buffer[0] = buffer[0].replaceAll(tag2, "");
    });
    buffer[0] = buffer[0].replace(/(?=<\/head>)/, insertTags.join(""));
  }
}, "insertIntoHead");
var returnWithoutSpecialBehavior = /* @__PURE__ */ __name((tag, children, props) => raw(new JSXNode(tag, props, toArray(children ?? [])).toString()), "returnWithoutSpecialBehavior");
var documentMetadataTag = /* @__PURE__ */ __name((tag, children, props, sort) => {
  if ("itemProp" in props) {
    return returnWithoutSpecialBehavior(tag, children, props);
  }
  let { precedence, blocking, ...restProps } = props;
  precedence = sort ? precedence ?? "" : void 0;
  if (sort) {
    restProps[dataPrecedenceAttr] = precedence;
  }
  const string = new JSXNode(tag, restProps, toArray(children || [])).toString();
  if (string instanceof Promise) {
    return string.then(
      (resString) => raw(string, [
        ...resString.callbacks || [],
        insertIntoHead(tag, resString, restProps, precedence)
      ])
    );
  } else {
    return raw(string, [insertIntoHead(tag, string, restProps, precedence)]);
  }
}, "documentMetadataTag");
var title = /* @__PURE__ */ __name(({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2) {
    const context = useContext(nameSpaceContext2);
    if (context === "svg" || context === "head") {
      return new JSXNode(
        "title",
        props,
        toArray(children ?? [])
      );
    }
  }
  return documentMetadataTag("title", children, props, false);
}, "title");
var script = /* @__PURE__ */ __name(({
  children,
  ...props
}) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (["src", "async"].some((k) => !props[k]) || nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("script", children, props);
  }
  return documentMetadataTag("script", children, props, false);
}, "script");
var style = /* @__PURE__ */ __name(({
  children,
  ...props
}) => {
  if (!["href", "precedence"].every((k) => k in props)) {
    return returnWithoutSpecialBehavior("style", children, props);
  }
  props["data-href"] = props.href;
  delete props.href;
  return documentMetadataTag("style", children, props, true);
}, "style");
var link = /* @__PURE__ */ __name(({ children, ...props }) => {
  if (["onLoad", "onError"].some((k) => k in props) || props.rel === "stylesheet" && (!("precedence" in props) || "disabled" in props)) {
    return returnWithoutSpecialBehavior("link", children, props);
  }
  return documentMetadataTag("link", children, props, isStylesheetLinkWithPrecedence(props));
}, "link");
var meta = /* @__PURE__ */ __name(({ children, ...props }) => {
  const nameSpaceContext2 = getNameSpaceContext();
  if (nameSpaceContext2 && useContext(nameSpaceContext2) === "head") {
    return returnWithoutSpecialBehavior("meta", children, props);
  }
  return documentMetadataTag("meta", children, props, false);
}, "meta");
var newJSXNode = /* @__PURE__ */ __name((tag, { children, ...props }) => (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new JSXNode(tag, props, toArray(children ?? []))
), "newJSXNode");
var form = /* @__PURE__ */ __name((props) => {
  if (typeof props.action === "function") {
    props.action = PERMALINK in props.action ? props.action[PERMALINK] : void 0;
  }
  return newJSXNode("form", props);
}, "form");
var formActionableElement = /* @__PURE__ */ __name((tag, props) => {
  if (typeof props.formAction === "function") {
    props.formAction = PERMALINK in props.formAction ? props.formAction[PERMALINK] : void 0;
  }
  return newJSXNode(tag, props);
}, "formActionableElement");
var input = /* @__PURE__ */ __name((props) => formActionableElement("input", props), "input");
var button = /* @__PURE__ */ __name((props) => formActionableElement("button", props), "button");

// node_modules/hono/dist/jsx/utils.js
var normalizeElementKeyMap = /* @__PURE__ */ new Map([
  ["className", "class"],
  ["htmlFor", "for"],
  ["crossOrigin", "crossorigin"],
  ["httpEquiv", "http-equiv"],
  ["itemProp", "itemprop"],
  ["fetchPriority", "fetchpriority"],
  ["noModule", "nomodule"],
  ["formAction", "formaction"]
]);
var normalizeIntrinsicElementKey = /* @__PURE__ */ __name((key) => normalizeElementKeyMap.get(key) || key, "normalizeIntrinsicElementKey");
var styleObjectForEach = /* @__PURE__ */ __name((style2, fn) => {
  for (const [k, v] of Object.entries(style2)) {
    const key = k[0] === "-" || !/[A-Z]/.test(k) ? k : k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    fn(
      key,
      v == null ? null : typeof v === "number" ? !key.match(
        /^(?:a|border-im|column(?:-c|s)|flex(?:$|-[^b])|grid-(?:ar|[^a])|font-w|li|or|sca|st|ta|wido|z)|ty$/
      ) ? `${v}px` : `${v}` : v
    );
  }
}, "styleObjectForEach");

// node_modules/hono/dist/jsx/base.js
var nameSpaceContext = void 0;
var getNameSpaceContext = /* @__PURE__ */ __name(() => nameSpaceContext, "getNameSpaceContext");
var toSVGAttributeName = /* @__PURE__ */ __name((key) => /[A-Z]/.test(key) && // Presentation attributes are findable in style object. "clip-path", "font-size", "stroke-width", etc.
// Or other un-deprecated kebab-case attributes. "overline-position", "paint-order", "strikethrough-position", etc.
key.match(
  /^(?:al|basel|clip(?:Path|Rule)$|co|do|fill|fl|fo|gl|let|lig|i|marker[EMS]|o|pai|pointe|sh|st[or]|text[^L]|tr|u|ve|w)/
) ? key.replace(/([A-Z])/g, "-$1").toLowerCase() : key, "toSVGAttributeName");
var emptyTags = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "keygen",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];
var booleanAttributes = [
  "allowfullscreen",
  "async",
  "autofocus",
  "autoplay",
  "checked",
  "controls",
  "default",
  "defer",
  "disabled",
  "download",
  "formnovalidate",
  "hidden",
  "inert",
  "ismap",
  "itemscope",
  "loop",
  "multiple",
  "muted",
  "nomodule",
  "novalidate",
  "open",
  "playsinline",
  "readonly",
  "required",
  "reversed",
  "selected"
];
var childrenToStringToBuffer = /* @__PURE__ */ __name((children, buffer) => {
  for (let i = 0, len = children.length; i < len; i++) {
    const child = children[i];
    if (typeof child === "string") {
      escapeToBuffer(child, buffer);
    } else if (typeof child === "boolean" || child === null || child === void 0) {
      continue;
    } else if (child instanceof JSXNode) {
      child.toStringToBuffer(buffer);
    } else if (typeof child === "number" || child.isEscaped) {
      ;
      buffer[0] += child;
    } else if (child instanceof Promise) {
      buffer.unshift("", child);
    } else {
      childrenToStringToBuffer(child, buffer);
    }
  }
}, "childrenToStringToBuffer");
var JSXNode = class {
  static {
    __name(this, "JSXNode");
  }
  tag;
  props;
  key;
  children;
  isEscaped = true;
  localContexts;
  constructor(tag, props, children) {
    this.tag = tag;
    this.props = props;
    this.children = children;
  }
  get type() {
    return this.tag;
  }
  // Added for compatibility with libraries that rely on React's internal structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get ref() {
    return this.props.ref || null;
  }
  toString() {
    const buffer = [""];
    this.localContexts?.forEach(([context, value]) => {
      context.values.push(value);
    });
    try {
      this.toStringToBuffer(buffer);
    } finally {
      this.localContexts?.forEach(([context]) => {
        context.values.pop();
      });
    }
    return buffer.length === 1 ? "callbacks" in buffer ? resolveCallbackSync(raw(buffer[0], buffer.callbacks)).toString() : buffer[0] : stringBufferToString(buffer, buffer.callbacks);
  }
  toStringToBuffer(buffer) {
    const tag = this.tag;
    const props = this.props;
    let { children } = this;
    buffer[0] += `<${tag}`;
    const normalizeKey = nameSpaceContext && useContext(nameSpaceContext) === "svg" ? (key) => toSVGAttributeName(normalizeIntrinsicElementKey(key)) : (key) => normalizeIntrinsicElementKey(key);
    for (let [key, v] of Object.entries(props)) {
      key = normalizeKey(key);
      if (key === "children") {
      } else if (key === "style" && typeof v === "object") {
        let styleStr = "";
        styleObjectForEach(v, (property, value) => {
          if (value != null) {
            styleStr += `${styleStr ? ";" : ""}${property}:${value}`;
          }
        });
        buffer[0] += ' style="';
        escapeToBuffer(styleStr, buffer);
        buffer[0] += '"';
      } else if (typeof v === "string") {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v, buffer);
        buffer[0] += '"';
      } else if (v === null || v === void 0) {
      } else if (typeof v === "number" || v.isEscaped) {
        buffer[0] += ` ${key}="${v}"`;
      } else if (typeof v === "boolean" && booleanAttributes.includes(key)) {
        if (v) {
          buffer[0] += ` ${key}=""`;
        }
      } else if (key === "dangerouslySetInnerHTML") {
        if (children.length > 0) {
          throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
        }
        children = [raw(v.__html)];
      } else if (v instanceof Promise) {
        buffer[0] += ` ${key}="`;
        buffer.unshift('"', v);
      } else if (typeof v === "function") {
        if (!key.startsWith("on") && key !== "ref") {
          throw new Error(`Invalid prop '${key}' of type 'function' supplied to '${tag}'.`);
        }
      } else {
        buffer[0] += ` ${key}="`;
        escapeToBuffer(v.toString(), buffer);
        buffer[0] += '"';
      }
    }
    if (emptyTags.includes(tag) && children.length === 0) {
      buffer[0] += "/>";
      return;
    }
    buffer[0] += ">";
    childrenToStringToBuffer(children, buffer);
    buffer[0] += `</${tag}>`;
  }
};
var JSXFunctionNode = class extends JSXNode {
  static {
    __name(this, "JSXFunctionNode");
  }
  toStringToBuffer(buffer) {
    const { children } = this;
    const props = { ...this.props };
    if (children.length) {
      props.children = children.length === 1 ? children[0] : children;
    }
    const res = this.tag.call(null, props);
    if (typeof res === "boolean" || res == null) {
      return;
    } else if (res instanceof Promise) {
      if (globalContexts.length === 0) {
        buffer.unshift("", res);
      } else {
        const currentContexts = globalContexts.map((c) => [c, c.values.at(-1)]);
        buffer.unshift(
          "",
          res.then((childRes) => {
            if (childRes instanceof JSXNode) {
              childRes.localContexts = currentContexts;
            }
            return childRes;
          })
        );
      }
    } else if (res instanceof JSXNode) {
      res.toStringToBuffer(buffer);
    } else if (typeof res === "number" || res.isEscaped) {
      buffer[0] += res;
      if (res.callbacks) {
        buffer.callbacks ||= [];
        buffer.callbacks.push(...res.callbacks);
      }
    } else {
      escapeToBuffer(res, buffer);
    }
  }
};
var JSXFragmentNode = class extends JSXNode {
  static {
    __name(this, "JSXFragmentNode");
  }
  toStringToBuffer(buffer) {
    childrenToStringToBuffer(this.children, buffer);
  }
};
var initDomRenderer = false;
var jsxFn = /* @__PURE__ */ __name((tag, props, children) => {
  if (!initDomRenderer) {
    for (const k in domRenderers) {
      ;
      components_exports[k][DOM_RENDERER] = domRenderers[k];
    }
    initDomRenderer = true;
  }
  if (typeof tag === "function") {
    return new JSXFunctionNode(tag, props, children);
  } else if (components_exports[tag]) {
    return new JSXFunctionNode(
      components_exports[tag],
      props,
      children
    );
  } else if (tag === "svg" || tag === "head") {
    nameSpaceContext ||= createContext("");
    return new JSXNode(tag, props, [
      new JSXFunctionNode(
        nameSpaceContext,
        {
          value: tag
        },
        children
      )
    ]);
  } else {
    return new JSXNode(tag, props, children);
  }
}, "jsxFn");
var Fragment = /* @__PURE__ */ __name(({
  children
}) => {
  return new JSXFragmentNode(
    "",
    {
      children
    },
    Array.isArray(children) ? children : children ? [children] : []
  );
}, "Fragment");

// node_modules/hono/dist/jsx/jsx-dev-runtime.js
function jsxDEV(tag, props, key) {
  let node;
  if (!props || !("children" in props)) {
    node = jsxFn(tag, props, []);
  } else {
    const children = props.children;
    node = Array.isArray(children) ? jsxFn(tag, props, children) : jsxFn(tag, props, [children]);
  }
  node.key = key;
  return node;
}
__name(jsxDEV, "jsxDEV");

// src/components/Nav.tsx
var navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/uses", label: "My Gear" },
  { href: "/reading-list", label: "Reading List" }
];
var Nav = /* @__PURE__ */ __name(({ currentPath }) => {
  return /* @__PURE__ */ jsxDEV("nav", { children: /* @__PURE__ */ jsxDEV("div", { class: "nav-inner", children: [
    /* @__PURE__ */ jsxDEV("a", { href: "/", class: "nav-logo", children: "CR" }),
    /* @__PURE__ */ jsxDEV("ul", { class: "nav-links", children: navLinks.map((link2) => /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV(
      "a",
      {
        href: link2.href,
        class: currentPath === link2.href ? "active" : "",
        children: link2.label
      }
    ) })) })
  ] }) });
}, "Nav");

// src/components/Footer.tsx
var Footer = /* @__PURE__ */ __name(() => {
  return /* @__PURE__ */ jsxDEV("footer", { children: /* @__PURE__ */ jsxDEV("div", { class: "footer-inner", children: [
    /* @__PURE__ */ jsxDEV("p", { children: "\xA9 2026 Chris Rose. All rights reserved." }),
    /* @__PURE__ */ jsxDEV("ul", { class: "footer-links", children: [
      /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/", children: "Home" }) }),
      /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/about", children: "About" }) }),
      /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/uses", children: "My Gear" }) }),
      /* @__PURE__ */ jsxDEV("li", { children: /* @__PURE__ */ jsxDEV("a", { href: "/reading-list", children: "Reading List" }) })
    ] })
  ] }) });
}, "Footer");

// src/components/Layout.tsx
var Layout = /* @__PURE__ */ __name(({
  title: title2,
  description,
  siteUrl,
  assetVersion,
  ogImage = "/og-image.png",
  currentPath,
  bodyClass,
  headExtra,
  bodyExtra,
  children
}) => {
  const fullTitle = `${title2} \u2014 Chris Rose`;
  const ogImageUrl = `${siteUrl}${ogImage}`;
  return /* @__PURE__ */ jsxDEV("html", { lang: "en", class: "no-js", children: [
    /* @__PURE__ */ jsxDEV("head", { children: [
      /* @__PURE__ */ jsxDEV("meta", { charset: "UTF-8" }),
      /* @__PURE__ */ jsxDEV("meta", { "http-equiv": "Cache-Control", content: "no-cache, no-store, must-revalidate" }),
      /* @__PURE__ */ jsxDEV("meta", { "http-equiv": "Pragma", content: "no-cache" }),
      /* @__PURE__ */ jsxDEV("meta", { "http-equiv": "Expires", content: "0" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ jsxDEV("title", { children: fullTitle }),
      /* @__PURE__ */ jsxDEV("meta", { name: "description", content: description }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:site_name", content: "Chris Rose" }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:url", content: `${siteUrl}${currentPath}` }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:title", content: fullTitle }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:description", content: description }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:image", content: ogImageUrl }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:image:width", content: "1200" }),
      /* @__PURE__ */ jsxDEV("meta", { property: "og:image:height", content: "630" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "twitter:card", content: "summary_large_image" }),
      /* @__PURE__ */ jsxDEV("meta", { name: "twitter:title", content: fullTitle }),
      /* @__PURE__ */ jsxDEV("meta", { name: "twitter:description", content: description }),
      /* @__PURE__ */ jsxDEV("meta", { name: "twitter:image", content: ogImageUrl }),
      /* @__PURE__ */ jsxDEV("link", { rel: "preconnect", href: "https://fonts.googleapis.com" }),
      /* @__PURE__ */ jsxDEV("link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }),
      /* @__PURE__ */ jsxDEV(
        "link",
        {
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
          rel: "stylesheet"
        }
      ),
      /* @__PURE__ */ jsxDEV("link", { rel: "stylesheet", href: `/styles.css?v=${assetVersion}` }),
      headExtra
    ] }),
    /* @__PURE__ */ jsxDEV("body", { class: bodyClass || "", children: [
      /* @__PURE__ */ jsxDEV(Nav, { currentPath }),
      /* @__PURE__ */ jsxDEV("main", { children }),
      /* @__PURE__ */ jsxDEV(Footer, {}),
      bodyExtra
    ] })
  ] });
}, "Layout");

// src/components/IntroOverlay.tsx
var IntroOverlay = /* @__PURE__ */ __name(() => {
  return /* @__PURE__ */ jsxDEV("div", { id: "intro-overlay", children: [
    /* @__PURE__ */ jsxDEV("canvas", { id: "intro-matrix-canvas" }),
    /* @__PURE__ */ jsxDEV("canvas", { id: "intro-dive-canvas" }),
    /* @__PURE__ */ jsxDEV("div", { class: "intro-glitch-flash" }),
    /* @__PURE__ */ jsxDEV("div", { class: "intro-happy-mac", children: /* @__PURE__ */ jsxDEV("svg", { viewBox: "0 0 32 32", xmlns: "http://www.w3.org/2000/svg", children: [
      /* @__PURE__ */ jsxDEV("rect", { x: "8", y: "2", width: "16", height: "22", rx: "2", fill: "#fff" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "10", y: "4", width: "12", height: "12", fill: "#000" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "12", y: "7", width: "2", height: "2", fill: "#fff" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "18", y: "7", width: "2", height: "2", fill: "#fff" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "15", y: "10", width: "2", height: "1", fill: "#fff" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "12", y: "12", width: "2", height: "1", fill: "#fff" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "13", y: "13", width: "6", height: "1", fill: "#fff" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "18", y: "12", width: "2", height: "1", fill: "#fff" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "10", y: "18", width: "12", height: "2", fill: "#ccc" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "13", y: "19", width: "6", height: "1", fill: "#999" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "11", y: "24", width: "10", height: "2", rx: "1", fill: "#ddd" }),
      /* @__PURE__ */ jsxDEV("rect", { x: "14", y: "22", width: "4", height: "2", fill: "#ccc" })
    ] }) }),
    /* @__PURE__ */ jsxDEV("svg", { class: "intro-hello-svg", viewBox: "0 0 800 200", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxDEV("path", { d: "M 151.5 129.8 C 219.3,103.3 190.5,118.8 219.3,103.3 C 241.6,91.4 253.2,75.4 244.3,68.6 C 211.8,43.5 192.5,134.8 197.2,134.8 C 201.9,134.8 201.6,108.2 225.5,102.2 C 249.4,96.2 257.8,104.2 258.9,108.0 C 260.7,114.0 253.5,123.6 254.7,127.1 C 259.8,141.7 342.3,127.4 348.8,110.8 C 355.8,93.0 294.6,93.8 306.7,122.3 C 311.2,132.8 338.8,135.4 353.4,133.9 C 406.5,128.2 442.9,99.3 441.6,77.1 C 439.9,48.4 382.8,77.5 396.6,121.7 C 401.9,138.8 446.7,133.2 460.0,128.7 C 484.5,120.3 527.7,96.1 519.8,72.6 C 511.6,48.1 449.4,88.5 478.0,125.2 C 487.5,137.5 516.0,133.3 523.8,131.4 C 542.4,127.0 548.4,110.7 563.8,103.6 C 583.2,94.7 613.9,101.4 615.2,112.0 C 618.0,135.5 577.3,135.5 562.1,130.2 C 549.0,125.6 546.0,112.0 563.6,103.6 C 575.6,97.9 594.9,97.7 620.2,104.2 C 630.6,106.8 639.5,106.4 646.5,102.1" }) }),
    /* @__PURE__ */ jsxDEV("div", { class: "intro-wake-text" }),
    /* @__PURE__ */ jsxDEV("div", { class: "intro-pills", children: [
      /* @__PURE__ */ jsxDEV("button", { class: "intro-pill intro-pill--red", type: "button", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "intro-pill-circle" }),
        "Stay in the Matrix"
      ] }),
      /* @__PURE__ */ jsxDEV("button", { class: "intro-pill intro-pill--blue", type: "button", children: [
        /* @__PURE__ */ jsxDEV("span", { class: "intro-pill-circle" }),
        "Enter the site"
      ] })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos", style: "display:none;", children: [
      /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-bg" }),
      /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-banner", children: "\u{1F389} Congratulations!!! \u{1F389}" }),
      /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-visitor", children: "\u2B50 You are the 1,000,000th visitor! \u2B50" }),
      /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-popup", children: [
        /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-popup-titlebar", children: "\u26A0\uFE0F Important Message" }),
        /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-popup-body", children: "CLICK HERE to claim your FREE prize! \u{1F5B1}" })
      ] }),
      /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-marquee", children: /* @__PURE__ */ jsxDEV("span", { children: "\u{1F6A7} Under Construction \u{1F6A7} Best viewed in Netscape Navigator \u{1F6A7} Sign my guestbook! \u{1F6A7} Made with MS FrontPage \u{1F6A7}" }) }),
      /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-counter", children: "You are visitor #000,042" }),
      /* @__PURE__ */ jsxDEV("div", { class: "intro-chaos-exit" })
    ] }),
    /* @__PURE__ */ jsxDEV("div", { class: "intro-skip", children: "Press any key to skip" })
  ] });
}, "IntroOverlay");

// src/routes/pages.tsx
var pages = new Hono2();
pages.get("/", (c) => {
  const v = c.env.ASSET_VERSION;
  const introHead = /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("link", { rel: "stylesheet", href: `/intro.css?v=${v}` }),
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" })
  ] });
  const introBody = /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("script", { src: `/intro.js?v=${v}`, defer: true }),
    /* @__PURE__ */ jsxDEV("script", { src: `/particles.js?v=${v}`, defer: true }),
    /* @__PURE__ */ jsxDEV("script", { src: `/cursor.js?v=${v}`, defer: true })
  ] });
  const html2 = /* @__PURE__ */ jsxDEV(
    Layout,
    {
      title: "Technology Executive & Cybersecurity Leader",
      description: "Chris Rose is a technology executive with over two decades of experience in cybersecurity, network operations, sales leadership, and company strategy. VP at Aseva, Santa Barbara CA.",
      siteUrl: c.env.SITE_URL,
      assetVersion: v,
      currentPath: "/",
      bodyClass: "intro-active",
      headExtra: introHead,
      bodyExtra: introBody,
      children: [
        /* @__PURE__ */ jsxDEV(IntroOverlay, {}),
        /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("section", { class: "hero", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "hero-text", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "hero-eyebrow", children: "VP \xB7 Cybersecurity & Network Operations" }),
            /* @__PURE__ */ jsxDEV("h1", { children: [
              "Hi, I'm",
              "\n",
              "Chris Rose"
            ] }),
            /* @__PURE__ */ jsxDEV("p", { children: "A highly accomplished technology executive with over two decades of experience in operations management, company and product strategy, and high-touch customer management. Based in Santa Barbara, CA \u2014 helping organizations build secure, reliable infrastructure." }),
            /* @__PURE__ */ jsxDEV("div", { class: "hero-cta", children: [
              /* @__PURE__ */ jsxDEV("a", { href: "/about", class: "btn btn-primary", children: "About Me" }),
              /* @__PURE__ */ jsxDEV("a", { href: "/about#connect", class: "btn btn-outline", children: "Get in Touch" })
            ] })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "hero-photo", children: /* @__PURE__ */ jsxDEV("img", { src: "/images/chris-rose.jpg", alt: "Chris Rose", class: "photo-placeholder" }) })
        ] }) }),
        /* @__PURE__ */ jsxDEV("section", { class: "section", id: "what-i-do", style: "background: var(--color-bg-alt);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "section-header", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// expertise" }),
            /* @__PURE__ */ jsxDEV("h2", { children: "What I Do" }),
            /* @__PURE__ */ jsxDEV("p", { children: "Twenty years of experience across cybersecurity, network operations, sales leadership, and technology strategy." })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "grid-3", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "card", children: [
              /* @__PURE__ */ jsxDEV("div", { style: "margin-bottom:1rem;", children: /* @__PURE__ */ jsxDEV("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
                /* @__PURE__ */ jsxDEV("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
                /* @__PURE__ */ jsxDEV("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })
              ] }) }),
              /* @__PURE__ */ jsxDEV("h3", { children: "Cybersecurity Strategy" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Developing security programs, evaluating emerging threats, and guiding organizations toward risk-appropriate defenses including SASE, MDR, and Zero Trust frameworks." })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "card", children: [
              /* @__PURE__ */ jsxDEV("div", { style: "margin-bottom:1rem;", children: /* @__PURE__ */ jsxDEV("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
                /* @__PURE__ */ jsxDEV("rect", { x: "2", y: "2", width: "20", height: "8", rx: "2", ry: "2" }),
                /* @__PURE__ */ jsxDEV("rect", { x: "2", y: "14", width: "20", height: "8", rx: "2", ry: "2" }),
                /* @__PURE__ */ jsxDEV("line", { x1: "6", y1: "6", x2: "6.01", y2: "6" }),
                /* @__PURE__ */ jsxDEV("line", { x1: "6", y1: "18", x2: "6.01", y2: "18" })
              ] }) }),
              /* @__PURE__ */ jsxDEV("h3", { children: "Network Operations" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Designing and managing reliable, scalable network environments \u2014 from enterprise LAN/WAN to SD-WAN and cloud connectivity \u2014 aligned to real business requirements." })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "card", children: [
              /* @__PURE__ */ jsxDEV("div", { style: "margin-bottom:1rem;", children: /* @__PURE__ */ jsxDEV("svg", { width: "28", height: "28", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
                /* @__PURE__ */ jsxDEV("path", { d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
                /* @__PURE__ */ jsxDEV("circle", { cx: "9", cy: "7", r: "4" }),
                /* @__PURE__ */ jsxDEV("path", { d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
                /* @__PURE__ */ jsxDEV("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
              ] }) }),
              /* @__PURE__ */ jsxDEV("h3", { children: "Technology Leadership" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Partnering with CIOs and IT leaders to evaluate vendors, plan technology deployments, build high-performing teams, and develop product and company strategy." })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxDEV("section", { class: "section", id: "expertise", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "section-header", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// focus areas" }),
            /* @__PURE__ */ jsxDEV("h2", { children: "Areas of Expertise" }),
            /* @__PURE__ */ jsxDEV("p", { children: "The domains where I spend most of my time at Aseva." })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "grid-3", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "card", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "tag", style: "margin-bottom:0.75rem;display:inline-block;", children: "Cybersecurity" }),
              /* @__PURE__ */ jsxDEV("h3", { children: "Security Architecture" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Zero trust frameworks, SASE deployments, MDR programs, threat detection, and incident response planning for midsize businesses." })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "card", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "tag", style: "margin-bottom:0.75rem;display:inline-block;", children: "Networking" }),
              /* @__PURE__ */ jsxDEV("h3", { children: "Network Infrastructure" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Enterprise LAN/WAN, SD-WAN, cloud connectivity, and infrastructure reliability at scale using Cisco, Juniper, and ADTRAN solutions." })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "card", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "tag", style: "margin-bottom:0.75rem;display:inline-block;", children: "AI & Automation" }),
              /* @__PURE__ */ jsxDEV("h3", { children: "Agentic AI & Workflow Innovation" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Challenging the team at Aseva to fully embrace agentic coding \u2014 leading an initiative where engineers are building an entire suite of AI-powered workflows and apps to optimize how we run the business, from operations to client delivery." })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxDEV("section", { class: "section", style: "text-align: center;", children: /* @__PURE__ */ jsxDEV("div", { class: "container", style: "max-width: 560px;", children: [
          /* @__PURE__ */ jsxDEV("h2", { children: "Want to Know More?" }),
          /* @__PURE__ */ jsxDEV("p", { style: "margin: 1rem 0 2rem;", children: "Get the full picture \u2014 my background, experience, and what drives the work I do at Aseva and beyond." }),
          /* @__PURE__ */ jsxDEV("a", { href: "/about", class: "btn btn-primary", children: "About Me" })
        ] }) })
      ]
    }
  );
  return c.html(html2);
});
pages.get("/about", (c) => {
  const v = c.env.ASSET_VERSION;
  const aboutHead = /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" }),
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" })
  ] });
  const aboutBody = /* @__PURE__ */ jsxDEV("script", { src: `/animations.js?v=${v}`, defer: true });
  return c.html(
    /* @__PURE__ */ jsxDEV(
      Layout,
      {
        title: "About \u2014 Chris Rose",
        description: "Chris Rose is a technology executive with over two decades of experience in cybersecurity, network operations, and sales leadership. VP at Aseva (formerly Impulse Advanced Communications), Santa Barbara CA.",
        siteUrl: c.env.SITE_URL,
        assetVersion: v,
        currentPath: "/about",
        headExtra: aboutHead,
        bodyExtra: aboutBody,
        children: [
          /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("section", { class: "section", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// about" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Background & Experience" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "about-layout", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "about-photo-wrap anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("img", { src: "/images/chris-rose.jpg", alt: "Chris Rose", class: "photo-placeholder" }),
                /* @__PURE__ */ jsxDEV("div", { class: "card", style: "margin-top:1.5rem;", children: [
                  /* @__PURE__ */ jsxDEV("h3", { style: "margin-bottom:1rem;font-size:0.9rem;font-family:var(--font-mono);letter-spacing:0.06em;text-transform:uppercase;", children: "Quick Facts" }),
                  /* @__PURE__ */ jsxDEV("ul", { style: "list-style:none;display:flex;flex-direction:column;gap:0.6rem;", children: [
                    /* @__PURE__ */ jsxDEV("li", { style: "display:flex;gap:0.5rem;font-size:0.875rem;", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "\u{1F4CD}" }),
                      /* @__PURE__ */ jsxDEV("span", { style: "color:var(--color-text-muted);", children: "Santa Barbara, CA" })
                    ] }),
                    /* @__PURE__ */ jsxDEV("li", { style: "display:flex;gap:0.5rem;font-size:0.875rem;", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "\u{1F4BC}" }),
                      /* @__PURE__ */ jsxDEV("span", { style: "color:var(--color-text-muted);", children: "VP, Cybersecurity & Network Ops \u2014 Aseva" })
                    ] }),
                    /* @__PURE__ */ jsxDEV("li", { style: "display:flex;gap:0.5rem;font-size:0.875rem;", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "\u{1F393}" }),
                      /* @__PURE__ */ jsxDEV("span", { style: "color:var(--color-text-muted);", children: "B.S. Business Economics, UC Santa Barbara" })
                    ] }),
                    /* @__PURE__ */ jsxDEV("li", { style: "display:flex;gap:0.5rem;font-size:0.875rem;", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "\u{1F3C6}" }),
                      /* @__PURE__ */ jsxDEV("span", { style: "color:var(--color-text-muted);", children: 'Pacific Coast Business Times "40 Under 40"' })
                    ] }),
                    /* @__PURE__ */ jsxDEV("li", { style: "display:flex;gap:0.5rem;font-size:0.875rem;", children: [
                      /* @__PURE__ */ jsxDEV("span", { children: "\u{1F4C5}" }),
                      /* @__PURE__ */ jsxDEV("span", { style: "color:var(--color-text-muted);", children: "20+ years in tech leadership" })
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxDEV("div", { style: "margin-top:1.5rem;", children: /* @__PURE__ */ jsxDEV("a", { href: "#connect", class: "btn btn-primary", style: "width:100%;justify-content:center;", children: "Get in Touch" }) })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "about-content", children: [
                /* @__PURE__ */ jsxDEV("h2", { children: "Background" }),
                /* @__PURE__ */ jsxDEV("p", { children: "Chris Rose is a technology executive with over two decades of experience in operations management, company and product strategy, and high-touch customer management. He currently serves as Vice President of Cybersecurity and Network Operations at Aseva \u2014 a Santa Barbara\u2013based technology services company he helped transform through a full rebrand in October 2025." }),
                /* @__PURE__ */ jsxDEV("p", { children: "Throughout his career, Chris has worked alongside CIOs, IT directors, and business leaders to plan and deploy modern network and security environments. His approach combines deep technical knowledge with a proven ability to lead sales teams, manage vendor partnerships, and drive measurable revenue growth." }),
                /* @__PURE__ */ jsxDEV("h2", { children: "At Aseva" }),
                /* @__PURE__ */ jsxDEV("p", { children: "Chris leads teams responsible for network operations, client services, and cybersecurity strategy. He formulated and executed the company's product pivot toward cybersecurity sales and support \u2014 a transformation that included identifying new technology partners, redesigning the brand, and building new go-to-market strategies." }),
                /* @__PURE__ */ jsxDEV("p", { children: "A hallmark of his approach: he established a private lounge in downtown Santa Barbara to connect with IT professionals, leading to direct conversations with over 50 CIOs and IT Directors. This community-first mindset is core to how Aseva operates." }),
                /* @__PURE__ */ jsxDEV("h2", { id: "skills", children: "Skills & Expertise" }),
                /* @__PURE__ */ jsxDEV("p", { children: "Leadership and business capabilities developed across 20+ years:" }),
                /* @__PURE__ */ jsxDEV("div", { class: "skills-cloud", style: "margin-bottom:2rem;", children: [
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-lg", children: "Executive Leadership" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-lg", children: "Cybersecurity" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-lg", children: "Sales Management" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-md", children: "Account Management" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-md", children: "Product Management" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-md", children: "Network Design" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-md", children: "Public Speaking" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-md", children: "Contract Negotiation" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-md", children: "Vendor Management" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-md", children: "Event Management" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-sm", children: "Pricing Strategy" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-sm", children: "Tech Demos" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-sm", children: "Troubleshooting" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-sm", children: "CRM (Salesforce)" }),
                  /* @__PURE__ */ jsxDEV("span", { class: "skill-pill skill-pill-sm", children: "KPI Development" })
                ] }),
                /* @__PURE__ */ jsxDEV("p", { children: "Vendor & technology knowledge:" }),
                /* @__PURE__ */ jsxDEV("div", { class: "tech-stack-grid", style: "margin-bottom:2.5rem;", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "tech-card anim-fade-up", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "tech-card-label", children: "SASE" }),
                    /* @__PURE__ */ jsxDEV("div", { class: "vendor-tags", children: [
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Cato Networks" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Cloudflare" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Zscaler" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "tech-card anim-fade-up", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "tech-card-label", children: "MDR / Security" }),
                    /* @__PURE__ */ jsxDEV("div", { class: "vendor-tags", children: [
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "eSentire" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "ArcticWolf" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "BlueVoyant" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Endpoint Protection" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "tech-card anim-fade-up", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "tech-card-label", children: "Networking Hardware" }),
                    /* @__PURE__ */ jsxDEV("div", { class: "vendor-tags", children: [
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Cisco" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Juniper" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "ADTRAN" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Enterprise Broadband" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "tech-card anim-fade-up", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "tech-card-label", children: "SD-WAN" }),
                    /* @__PURE__ */ jsxDEV("div", { class: "vendor-tags", children: [
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "128 Technology" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "VeloCloud" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Juniper" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "tech-card anim-fade-up", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "tech-card-label", children: "Collaboration & AI" }),
                    /* @__PURE__ */ jsxDEV("div", { class: "vendor-tags", children: [
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Cisco Webex" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "MS Teams" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Broadsoft UCaaS" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "ChatGPT" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Copilot" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Apple / iOS" }),
                      /* @__PURE__ */ jsxDEV("span", { class: "vendor-tag", children: "Claude Code" })
                    ] })
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section", id: "career-timeline", style: "background: var(--color-bg-alt);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// career" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Career Timeline" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Over two decades building technology businesses and leading teams on the Central Coast of California." })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "timeline", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "timeline-entry anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-dot" }),
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-content", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-badge", children: [
                    /* @__PURE__ */ jsxDEV("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round", children: /* @__PURE__ */ jsxDEV("polyline", { points: "20 6 9 17 4 12" }) }),
                    "Rebranded to Aseva \xB7 Oct 2025 (led by Chris)"
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-role", children: "Vice President" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-meta", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-company", children: "Aseva" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Santa Barbara, CA" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Jan 2022 \u2013 Present" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("ul", { class: "timeline-achievements", children: [
                    /* @__PURE__ */ jsxDEV("li", { children: "Formulated and executed company product strategies, including a pivot toward cybersecurity sales and support \u2014 directly contributing to a 15% increase in total company revenue." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Managed technical teams including Service Implementation, Network Operations, and TAC; developed KPIs and eliminated departmental silos." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Spearheaded discovery of new technology vendors and partners \u2014 evaluated and integrated SASE, MDR, and SD-WAN solutions into the product portfolio." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Established a private lounge in downtown Santa Barbara to connect with IT professionals, leading to meetings with over 50 CIOs and IT Directors." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Led the full company rebrand from Impulse Advanced Communications to Aseva in October 2025, including a new brandbook, website, and marketing materials." })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "timeline-entry anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-dot" }),
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-content", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-role", children: "VP, Client Services" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-meta", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-company", children: "Impulse Advanced Communications" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Santa Barbara, CA" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Jan 2015 \u2013 Jan 2022" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("ul", { class: "timeline-achievements", children: [
                    /* @__PURE__ */ jsxDEV("li", { children: "Oversaw the management of Client Services and Sales teams, driving sales, customer satisfaction, and retention for a growing portfolio of enterprise clients." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Played a key role in product development, launching hosted PBX services via Broadsoft and integrating Webex into the UCaaS system." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Managed the product catalog \u2014 overseeing all product pricing and negotiating vendor contracts across the full portfolio." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Cultivated and maintained strong relationships with senior CIOs and IT directors across the client base." })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "timeline-entry anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-dot" }),
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-content", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-role", children: "Director of Sales" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-meta", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-company", children: "Impulse Advanced Communications" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Santa Barbara, CA" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Jan 2006 \u2013 Jan 2015" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("ul", { class: "timeline-achievements", children: [
                    /* @__PURE__ */ jsxDEV("li", { children: "Developed and implemented sales strategies to expand market reach and increase revenue." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Actively led the successful launch of a hosted VoIP service, contributing to a substantial 45% revenue increase." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Expanded the company's geographic reach by opening offices in San Luis Obispo, Ventura, and Santa Monica." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Led and trained sales teams to improve performance and consistently achieve targets." })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "timeline-entry anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-dot" }),
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-content", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-role", children: "Sales Director" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-meta", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-company", children: "Netlojix" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Santa Barbara, CA" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Jan 2004 \u2013 Jan 2006" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("ul", { class: "timeline-achievements", children: [
                    /* @__PURE__ */ jsxDEV("li", { children: "Oversaw sales operations, setting and achieving sales targets across the organization." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Increased client base by 30% through targeted sales initiatives and strategic account development." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Improved sales team productivity by implementing Salesforce.com CRM \u2014 a transformative change for the team's workflow and pipeline visibility." })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "timeline-entry anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-dot" }),
                /* @__PURE__ */ jsxDEV("div", { class: "timeline-content", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-role", children: "Sales Executive" }),
                  /* @__PURE__ */ jsxDEV("div", { class: "timeline-meta", children: [
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-company", children: "Netlojix" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "Santa Barbara, CA" }),
                    /* @__PURE__ */ jsxDEV("span", { class: "timeline-meta-sep", children: "\xB7" }),
                    /* @__PURE__ */ jsxDEV("span", { children: "May 2002 \u2013 Jan 2004" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("ul", { class: "timeline-achievements", children: [
                    /* @__PURE__ */ jsxDEV("li", { children: "Launched a sales career by prospecting and closing broadband and hosting services to businesses on the Central Coast of California." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Negotiated contracts, conducted product demonstrations, and successfully built a client base from the ground up." }),
                    /* @__PURE__ */ jsxDEV("li", { children: "Developed the foundational skills in consultative selling, relationship management, and technical product knowledge that would define a 20+ year career." })
                  ] })
                ] })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section", id: "recognition", style: "background: var(--color-bg);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// recognition" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Achievement Spotlight" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "achievement-grid", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "achievement-tile achievement-tile-award anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-icon-wrap", children: /* @__PURE__ */ jsxDEV("svg", { width: "38", height: "38", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", "stroke-width": "1.6", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
                  /* @__PURE__ */ jsxDEV("circle", { cx: "12", cy: "8", r: "6" }),
                  /* @__PURE__ */ jsxDEV("path", { d: "M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" })
                ] }) }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-headline", children: [
                  /* @__PURE__ */ jsxDEV("span", { class: "award-scramble-num", children: "40" }),
                  " Under 40"
                ] }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-subline", children: "Pacific Coast Business Times" }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-label", children: "Santa Barbara, CA" })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "achievement-tile anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-number", "data-counter-to": "20", "data-counter-suffix": "+", children: "0" }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-headline", children: "Years in Tech" }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-subline", children: "Sales \u2192 VP \xB7 2002 to present" }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-label", children: "Central Coast, California" })
              ] }),
              /* @__PURE__ */ jsxDEV("div", { class: "achievement-tile anim-fade-up", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-number", "data-counter-to": "50", "data-counter-suffix": "+", children: "0" }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-headline", children: "CIOs & IT Directors" }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-subline", children: "Met personally in Santa Barbara" }),
                /* @__PURE__ */ jsxDEV("div", { class: "achievement-label", children: "Via private lounge \u2014 Aseva" })
              ] })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section", id: "connect", style: "background: var(--color-bg-alt);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", style: "margin-bottom:2.5rem;", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// connect" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Get In Touch" }),
              /* @__PURE__ */ jsxDEV("p", { children: "Open to conversations about technology strategy, cybersecurity, network operations, or potential partnerships. I typically respond within 1\u20132 business days." })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "connect-grid", children: [
              /* @__PURE__ */ jsxDEV("a", { class: "connect-card anim-fade-up", href: "mailto:crose@aseva.com", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "connect-signal" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-channel", children: "// email" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-value", children: "crose@aseva.com" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-action", children: [
                  "Compose message ",
                  /* @__PURE__ */ jsxDEV("span", { class: "connect-arrow", children: "\u2192" })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("a", { class: "connect-card anim-fade-up", href: "https://www.linkedin.com/in/chrislrose", target: "_blank", rel: "noopener noreferrer", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "connect-signal" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-channel", children: "// linkedin" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-value", children: "in/chrislrose" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-action", children: [
                  "View profile ",
                  /* @__PURE__ */ jsxDEV("span", { class: "connect-arrow", children: "\u2192" })
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("a", { class: "connect-card anim-fade-up", href: "tel:+18058846368", children: [
                /* @__PURE__ */ jsxDEV("div", { class: "connect-signal" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-channel", children: "// phone" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-value", children: "805-884-6368" }),
                /* @__PURE__ */ jsxDEV("div", { class: "connect-card-action", children: [
                  "Call direct ",
                  /* @__PURE__ */ jsxDEV("span", { class: "connect-arrow", children: "\u2192" })
                ] })
              ] })
            ] })
          ] }) })
        ]
      }
    )
  );
});
pages.get("/contact", (c) => {
  const v = c.env.ASSET_VERSION;
  const contactHead = /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" }),
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" })
  ] });
  const contactBody = /* @__PURE__ */ jsxDEV("script", { src: `/animations.js?v=${v}`, defer: true });
  return c.html(
    /* @__PURE__ */ jsxDEV(
      Layout,
      {
        title: "Contact \u2014 Chris Rose",
        description: "Get in touch with Chris Rose \u2014 technology executive, VP of Cybersecurity and Network Operations at Aseva, Santa Barbara CA.",
        siteUrl: c.env.SITE_URL,
        assetVersion: v,
        currentPath: "/contact",
        headExtra: contactHead,
        bodyExtra: contactBody,
        children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("section", { class: "section", children: [
          /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// contact" }),
            /* @__PURE__ */ jsxDEV("h2", { children: "Let's Connect" })
          ] }),
          /* @__PURE__ */ jsxDEV("div", { class: "contact-layout", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "contact-info anim-fade-up", children: [
              /* @__PURE__ */ jsxDEV("p", { children: "I'm always open to conversations about technology strategy, cybersecurity, network operations, or potential partnerships. Reach out through any of the channels below." }),
              /* @__PURE__ */ jsxDEV("div", { class: "contact-links", children: [
                /* @__PURE__ */ jsxDEV("a", { href: "mailto:crose@aseva.com", class: "contact-link", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "contact-link-icon", children: /* @__PURE__ */ jsxDEV("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
                    /* @__PURE__ */ jsxDEV("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
                    /* @__PURE__ */ jsxDEV("polyline", { points: "22,6 12,13 2,6" })
                  ] }) }),
                  "crose@aseva.com"
                ] }),
                /* @__PURE__ */ jsxDEV("a", { href: "https://www.linkedin.com/in/chrislrose", class: "contact-link", target: "_blank", rel: "noopener", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "contact-link-icon", children: /* @__PURE__ */ jsxDEV("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
                    /* @__PURE__ */ jsxDEV("path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }),
                    /* @__PURE__ */ jsxDEV("rect", { x: "2", y: "9", width: "4", height: "12" }),
                    /* @__PURE__ */ jsxDEV("circle", { cx: "4", cy: "4", r: "2" })
                  ] }) }),
                  "linkedin.com/in/chrislrose"
                ] }),
                /* @__PURE__ */ jsxDEV("a", { href: "tel:+18058846368", class: "contact-link", children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "contact-link-icon", children: /* @__PURE__ */ jsxDEV("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "var(--color-accent)", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", children: /* @__PURE__ */ jsxDEV("path", { d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.65 3.38 2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.56a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" }) }) }),
                  "805-884-6368"
                ] })
              ] }),
              /* @__PURE__ */ jsxDEV("p", { style: "margin-top:2rem;font-size:0.85rem;", children: "I typically respond within 1\u20132 business days." })
            ] }),
            /* @__PURE__ */ jsxDEV(
              "form",
              {
                class: "contact-form anim-fade-up",
                action: "https://formspree.io/f/YOUR_FORM_ID",
                method: "post",
                children: [
                  /* @__PURE__ */ jsxDEV("div", { class: "form-group", children: [
                    /* @__PURE__ */ jsxDEV("label", { for: "name", children: "Name" }),
                    /* @__PURE__ */ jsxDEV("input", { type: "text", id: "name", name: "name", placeholder: "Jane Smith", required: true, autocomplete: "name" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "form-group", children: [
                    /* @__PURE__ */ jsxDEV("label", { for: "email", children: "Email" }),
                    /* @__PURE__ */ jsxDEV("input", { type: "email", id: "email", name: "email", placeholder: "jane@example.com", required: true, autocomplete: "email" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "form-group", children: [
                    /* @__PURE__ */ jsxDEV("label", { for: "subject", children: "Subject" }),
                    /* @__PURE__ */ jsxDEV("input", { type: "text", id: "subject", name: "subject", placeholder: "What's this about?" })
                  ] }),
                  /* @__PURE__ */ jsxDEV("div", { class: "form-group", children: [
                    /* @__PURE__ */ jsxDEV("label", { for: "message", children: "Message" }),
                    /* @__PURE__ */ jsxDEV("textarea", { id: "message", name: "message", placeholder: "Tell me what's on your mind\u2026", required: true })
                  ] }),
                  /* @__PURE__ */ jsxDEV("button", { type: "submit", class: "btn btn-primary", style: "width:100%;justify-content:center;", children: [
                    "Send Message",
                    /* @__PURE__ */ jsxDEV("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round", children: [
                      /* @__PURE__ */ jsxDEV("line", { x1: "22", y1: "2", x2: "11", y2: "13" }),
                      /* @__PURE__ */ jsxDEV("polygon", { points: "22 2 15 22 11 13 2 9 22 2" })
                    ] })
                  ] })
                ]
              }
            )
          ] })
        ] }) })
      }
    )
  );
});
pages.get("/uses", (c) => {
  const v = c.env.ASSET_VERSION;
  const usesHead = /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" }),
    /* @__PURE__ */ jsxDEV("script", { src: "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" })
  ] });
  const usesBody = /* @__PURE__ */ jsxDEV(Fragment, { children: [
    /* @__PURE__ */ jsxDEV("script", { src: `/animations.js?v=${v}`, defer: true }),
    /* @__PURE__ */ jsxDEV("script", { src: `/uses.js?v=${v}`, defer: true })
  ] });
  return c.html(
    /* @__PURE__ */ jsxDEV(
      Layout,
      {
        title: "My Gear \u2014 Chris Rose",
        description: "The hardware, software, and tools Chris Rose uses day-to-day as a technology executive.",
        siteUrl: c.env.SITE_URL,
        assetVersion: v,
        currentPath: "/uses",
        headExtra: usesHead,
        bodyExtra: usesBody,
        children: [
          /* @__PURE__ */ jsxDEV("section", { class: "page-hero", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("div", { class: "anim-fade-up", children: [
            /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// my gear" }),
            /* @__PURE__ */ jsxDEV("h1", { children: "My Gear" }),
            /* @__PURE__ */ jsxDEV("p", { class: "page-hero__sub", children: "The hardware, software, and tools I rely on daily as a technology executive. Updated regularly." })
          ] }) }) }),
          /* @__PURE__ */ jsxDEV("div", { class: "gear-tabs-wrap", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: /* @__PURE__ */ jsxDEV("div", { class: "gear-tabs-bar", role: "tablist", children: [
            /* @__PURE__ */ jsxDEV("button", { class: "gear-tab active", "data-tab": "panel-hardware", role: "tab", "aria-selected": "true", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-icon", children: "\u{1F5A5}" }),
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-label", children: "Hardware" })
            ] }),
            /* @__PURE__ */ jsxDEV("button", { class: "gear-tab", "data-tab": "panel-software", role: "tab", "aria-selected": "false", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-icon", children: "\u{1F4BB}" }),
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-label", children: "Software" })
            ] }),
            /* @__PURE__ */ jsxDEV("button", { class: "gear-tab", "data-tab": "panel-projects", role: "tab", "aria-selected": "false", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-icon", children: "\u{1F680}" }),
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-label", children: "Projects" })
            ] }),
            /* @__PURE__ */ jsxDEV("button", { class: "gear-tab", "data-tab": "panel-podcasts", role: "tab", "aria-selected": "false", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-icon", children: "\u{1F399}" }),
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-label", children: "Podcasts" })
            ] }),
            /* @__PURE__ */ jsxDEV("button", { class: "gear-tab", "data-tab": "panel-hobbies", role: "tab", "aria-selected": "false", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-icon", children: "\u{1F3AF}" }),
              /* @__PURE__ */ jsxDEV("span", { class: "gear-tab-label", children: "Hobbies" })
            ] })
          ] }) }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section gear-panel", id: "panel-hardware", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", style: "margin-bottom:1.5rem;", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// hardware" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Hardware" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "hardware-grid", id: "hardware-grid", children: /* @__PURE__ */ jsxDEV("div", { class: "hardware-card", style: "opacity:0.4;", children: [
              /* @__PURE__ */ jsxDEV("div", { class: "hardware-photo-wrap" }),
              /* @__PURE__ */ jsxDEV("div", { class: "hardware-card-body", children: /* @__PURE__ */ jsxDEV("h3", { style: "color:var(--color-text-dim);", children: "Loading\u2026" }) })
            ] }) })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section gear-panel", id: "panel-software", hidden: true, children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", style: "margin-bottom:1.5rem;", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// software" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Software & Apps" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "grid-3", id: "software-grid" })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section gear-panel", id: "panel-projects", hidden: true, children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", style: "margin-bottom:1.5rem;", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// projects" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Projects" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "grid-3", id: "projects-grid" })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section gear-panel", id: "panel-podcasts", hidden: true, children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", style: "margin-bottom:1.5rem;", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// podcasts" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Favorite Podcasts" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "podcast-grid", id: "podcasts-grid" })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section gear-panel", id: "panel-hobbies", hidden: true, children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", style: "margin-bottom:1.5rem;", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// hobbies" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "Other Hobbies" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "hardware-grid", id: "hobbies-grid" })
          ] }) }),
          /* @__PURE__ */ jsxDEV("section", { class: "section", id: "now-section", style: "background: var(--color-bg-alt);", children: /* @__PURE__ */ jsxDEV("div", { class: "container", children: [
            /* @__PURE__ */ jsxDEV("div", { class: "section-header anim-fade-up", style: "margin-bottom:1.5rem;", children: [
              /* @__PURE__ */ jsxDEV("span", { class: "section-eyebrow", children: "// now" }),
              /* @__PURE__ */ jsxDEV("h2", { children: "What I'm Doing Now" })
            ] }),
            /* @__PURE__ */ jsxDEV("div", { class: "card anim-fade-up", id: "now-content" })
          ] }) })
        ]
      }
    )
  );
});
pages.get("/reading-list", (c) => {
  return c.html(
    /* @__PURE__ */ jsxDEV(
      Layout,
      {
        title: "Reading List",
        description: "Curated articles and resources from Chris Rose.",
        siteUrl: c.env.SITE_URL,
        assetVersion: c.env.ASSET_VERSION,
        ogImage: "/og-reading-list.png",
        currentPath: "/reading-list",
        children: /* @__PURE__ */ jsxDEV("div", { class: "container", style: "padding: 4rem 0;", children: [
          /* @__PURE__ */ jsxDEV("h1", { children: "Reading List" }),
          /* @__PURE__ */ jsxDEV("p", { style: "color: var(--color-text-muted);", children: "Coming in Phase 4." })
        ] })
      }
    )
  );
});

// src/db/queries.ts
async function getAdminByEmail(db, email) {
  const result = await db.prepare("SELECT id, email, password_hash FROM admin_users WHERE email = ?").bind(email).first();
  return result ?? null;
}
__name(getAdminByEmail, "getAdminByEmail");
async function getAdminById(db, id) {
  const result = await db.prepare("SELECT id, email, password_hash FROM admin_users WHERE id = ?").bind(id).first();
  return result ?? null;
}
__name(getAdminById, "getAdminById");
async function createSession(db, token, adminId, expiresAt) {
  await db.prepare("INSERT INTO sessions (token, admin_id, expires_at) VALUES (?, ?, ?)").bind(token, adminId, expiresAt).run();
}
__name(createSession, "createSession");
async function getSession(db, token) {
  const result = await db.prepare("SELECT token, admin_id, expires_at FROM sessions WHERE token = ? AND expires_at > datetime('now')").bind(token).first();
  return result ?? null;
}
__name(getSession, "getSession");
async function deleteSession(db, token) {
  await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
}
__name(deleteSession, "deleteSession");
async function getLinks(db, opts = {}) {
  const conditions = [];
  const bindings = [];
  if (!opts.includePrivate) {
    conditions.push("private = 0");
  }
  if (opts.category) {
    conditions.push("category = ?");
    bindings.push(opts.category);
  }
  if (opts.status) {
    conditions.push("status = ?");
    bindings.push(opts.status);
  }
  const where = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";
  const sql = "SELECT * FROM links" + where + " ORDER BY saved_at DESC";
  const stmt = db.prepare(sql);
  const result = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
  return result.results;
}
__name(getLinks, "getLinks");
async function getLinkById(db, id) {
  const result = await db.prepare("SELECT * FROM links WHERE id = ?").bind(id).first();
  return result ?? null;
}
__name(getLinkById, "getLinkById");
async function createLink(db, data) {
  const id = Date.now().toString(36);
  const savedAt = (/* @__PURE__ */ new Date()).toISOString();
  const read = data.status === "done" ? 1 : 0;
  await db.prepare(
    `INSERT INTO links (id, url, title, description, image, favicon, domain, category, tags, stars, note, summary, status, read, private, saved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    data.url,
    data.title ?? null,
    data.description ?? null,
    data.image ?? null,
    data.favicon ?? null,
    data.domain ?? null,
    data.category ?? null,
    data.tags ?? null,
    data.stars ?? 0,
    data.note ?? null,
    data.summary ?? null,
    data.status ?? null,
    read,
    data.private ?? 0,
    savedAt
  ).run();
  return { id, ...data, read, saved_at: savedAt };
}
__name(createLink, "createLink");
async function updateLink(db, id, data) {
  const existing = await getLinkById(db, id);
  if (!existing) return null;
  const merged = { ...existing, ...data };
  merged.read = merged.status === "done" ? 1 : 0;
  await db.prepare(
    `UPDATE links SET url = ?, title = ?, description = ?, image = ?, favicon = ?, domain = ?, category = ?, tags = ?, stars = ?, note = ?, summary = ?, status = ?, read = ?, private = ?
       WHERE id = ?`
  ).bind(
    merged.url,
    merged.title,
    merged.description,
    merged.image,
    merged.favicon,
    merged.domain,
    merged.category,
    merged.tags,
    merged.stars,
    merged.note,
    merged.summary,
    merged.status,
    merged.read,
    merged.private,
    id
  ).run();
  return merged;
}
__name(updateLink, "updateLink");
async function deleteLink(db, id) {
  const result = await db.prepare("DELETE FROM links WHERE id = ?").bind(id).run();
  return result.meta.changes > 0;
}
__name(deleteLink, "deleteLink");
async function getCategories(db) {
  const result = await db.prepare("SELECT name, sort_order FROM categories ORDER BY sort_order ASC").all();
  return result.results;
}
__name(getCategories, "getCategories");
async function getGearHardware(db) {
  const result = await db.prepare("SELECT * FROM gear_hardware ORDER BY sort_order").all();
  return result.results;
}
__name(getGearHardware, "getGearHardware");
async function getGearSoftware(db) {
  const result = await db.prepare("SELECT * FROM gear_software ORDER BY sort_order").all();
  return result.results;
}
__name(getGearSoftware, "getGearSoftware");
async function getGearHobbies(db) {
  const result = await db.prepare("SELECT * FROM gear_hobbies ORDER BY sort_order").all();
  return result.results;
}
__name(getGearHobbies, "getGearHobbies");
async function getGearProjects(db) {
  const result = await db.prepare("SELECT * FROM gear_projects ORDER BY sort_order").all();
  return result.results;
}
__name(getGearProjects, "getGearProjects");
async function getGearPodcasts(db) {
  const result = await db.prepare("SELECT * FROM gear_podcasts ORDER BY sort_order").all();
  return result.results;
}
__name(getGearPodcasts, "getGearPodcasts");
async function getSiteContent(db, id) {
  const result = await db.prepare("SELECT * FROM site_content WHERE id = ?").bind(id).first();
  return result ?? null;
}
__name(getSiteContent, "getSiteContent");

// src/lib/password.ts
var ITERATIONS = 1e5;
var KEY_LENGTH = 32;
function fromBase64(str) {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
__name(fromBase64, "fromBase64");
async function verifyPassword(password, hash) {
  const [saltB64, keyB64] = hash.split(":");
  if (!saltB64 || !keyB64) return false;
  const salt = fromBase64(saltB64);
  const expectedKey = fromBase64(keyB64);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    KEY_LENGTH * 8
  );
  const derivedBytes = new Uint8Array(derived);
  const expectedBytes = new Uint8Array(expectedKey);
  if (derivedBytes.length !== expectedBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < derivedBytes.length; i++) {
    diff |= derivedBytes[i] ^ expectedBytes[i];
  }
  return diff === 0;
}
__name(verifyPassword, "verifyPassword");

// src/lib/session.ts
var SESSION_MAX_AGE = 604800;
async function createSession2(db, adminId) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1e3).toISOString();
  await createSession(db, token, adminId, expiresAt);
  return token;
}
__name(createSession2, "createSession");
async function validateSession(db, token) {
  if (!token) return null;
  return getSession(db, token);
}
__name(validateSession, "validateSession");
async function destroySession(db, token) {
  await deleteSession(db, token);
}
__name(destroySession, "destroySession");
function setSessionCookie(token) {
  return `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE}`;
}
__name(setSessionCookie, "setSessionCookie");
function clearSessionCookie() {
  return "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
}
__name(clearSessionCookie, "clearSessionCookie");
function getSessionToken(cookieHeader) {
  if (!cookieHeader) return null;
  const match2 = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
  return match2 ? match2[1] : null;
}
__name(getSessionToken, "getSessionToken");

// src/routes/api/auth.ts
var authRoutes = new Hono2();
authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;
  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }
  const admin = await getAdminByEmail(c.env.DB, email);
  if (!admin) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }
  const token = await createSession2(c.env.DB, admin.id);
  c.header("Set-Cookie", setSessionCookie(token));
  return c.json({ authenticated: true, email: admin.email });
});
authRoutes.post("/logout", async (c) => {
  const cookieHeader = c.req.header("cookie");
  const token = getSessionToken(cookieHeader);
  if (token) {
    await destroySession(c.env.DB, token);
  }
  c.header("Set-Cookie", clearSessionCookie());
  return c.json({ authenticated: false });
});
authRoutes.get("/session", async (c) => {
  const cookieHeader = c.req.header("cookie");
  const token = getSessionToken(cookieHeader);
  if (!token) {
    return c.json({ authenticated: false });
  }
  const session = await validateSession(c.env.DB, token);
  if (!session) {
    return c.json({ authenticated: false });
  }
  const admin = await getAdminById(c.env.DB, session.admin_id);
  return c.json({
    authenticated: true,
    email: admin?.email ?? null
  });
});

// src/routes/api/gear.ts
var gearRoutes = new Hono2();
gearRoutes.get("/hardware", async (c) => {
  const items = await getGearHardware(c.env.DB);
  return c.json(items);
});
gearRoutes.get("/software", async (c) => {
  const items = await getGearSoftware(c.env.DB);
  return c.json(items);
});
gearRoutes.get("/hobbies", async (c) => {
  const items = await getGearHobbies(c.env.DB);
  return c.json(items);
});
gearRoutes.get("/projects", async (c) => {
  const items = await getGearProjects(c.env.DB);
  return c.json(items);
});
gearRoutes.get("/podcasts", async (c) => {
  const items = await getGearPodcasts(c.env.DB);
  return c.json(items);
});
gearRoutes.get("/now", async (c) => {
  const content = await getSiteContent(c.env.DB, "now");
  if (!content) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(content);
});

// node_modules/hono/dist/helper/factory/index.js
var createMiddleware = /* @__PURE__ */ __name((middleware) => middleware, "createMiddleware");

// src/middleware/auth.ts
var requireAuth = createMiddleware(
  async (c, next) => {
    const cookieHeader = c.req.header("cookie");
    const token = getSessionToken(cookieHeader);
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const session = await validateSession(c.env.DB, token);
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("session", session);
    await next();
  }
);

// src/routes/api/links.ts
var linkRoutes = new Hono2();
linkRoutes.get("/", async (c) => {
  const category = c.req.query("category");
  const status = c.req.query("status");
  const links = await getLinks(c.env.DB, {
    category: category || void 0,
    status: status || void 0,
    includePrivate: false
  });
  return c.json(links);
});
linkRoutes.get("/:id", async (c) => {
  const link2 = await getLinkById(c.env.DB, c.req.param("id"));
  if (!link2 || link2.private) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(link2);
});
linkRoutes.post("/", requireAuth, async (c) => {
  const body = await c.req.json();
  if (!body.url) {
    return c.json({ error: "url is required" }, 400);
  }
  const link2 = await createLink(c.env.DB, {
    url: body.url,
    title: body.title ?? null,
    description: body.description ?? null,
    image: body.image ?? null,
    favicon: body.favicon ?? null,
    domain: body.domain ?? null,
    category: body.category ?? null,
    tags: body.tags ?? null,
    stars: body.stars ?? 0,
    note: body.note ?? null,
    summary: body.summary ?? null,
    status: body.status ?? null,
    private: body.private ?? 0
  });
  return c.json(link2, 201);
});
linkRoutes.put("/:id", requireAuth, async (c) => {
  const body = await c.req.json();
  const updated = await updateLink(c.env.DB, c.req.param("id"), body);
  if (!updated) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.json(updated);
});
linkRoutes.delete("/:id", requireAuth, async (c) => {
  const deleted = await deleteLink(c.env.DB, c.req.param("id"));
  if (!deleted) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.body(null, 204);
});

// src/routes/api/categories.ts
var categoryRoutes = new Hono2();
categoryRoutes.get("/", async (c) => {
  const categories = await getCategories(c.env.DB);
  return c.json(categories);
});

// src/index.ts
var app = new Hono2();
app.route("/api/auth", authRoutes);
app.route("/api/gear", gearRoutes);
app.route("/api/links", linkRoutes);
app.route("/api/categories", categoryRoutes);
app.use("/api/*", requireAuth);
app.route("/", pages);
var src_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-BGjGwk/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-BGjGwk/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
