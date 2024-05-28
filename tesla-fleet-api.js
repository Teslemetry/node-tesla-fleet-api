var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var servers = {
    na: "https://fleet-api.prd.na.vn.cloud.tesla.com",
    eu: "https://fleet-api.prd.eu.vn.cloud.tesla.com",
    cn: "https://fleet-api.prd.cn.vn.cloud.tesla.cn",
};
var TeslaFleetApi = (function () {
    function TeslaFleetApi(accessToken, region, server, chargingScope, energyScope, partnerScope, userScope, vehicleScope) {
        if (accessToken === void 0) { accessToken = null; }
        if (region === void 0) { region = null; }
        if (server === void 0) { server = null; }
        if (chargingScope === void 0) { chargingScope = true; }
        if (energyScope === void 0) { energyScope = true; }
        if (partnerScope === void 0) { partnerScope = true; }
        if (userScope === void 0) { userScope = true; }
        if (vehicleScope === void 0) { vehicleScope = true; }
        this.server = null;
        this.accessToken = accessToken;
        if (server) {
            this.server = server;
        }
        else if (region && region in servers) {
            this.server = servers[region];
        }
        else {
            throw new Error("Either server or region must be provided.");
        }
        console.debug("Using server ".concat(this.server));
    }
    TeslaFleetApi.prototype._request = function (method_1, path_1) {
        return __awaiter(this, arguments, void 0, function (method, path, params, json) {
            var headers, query;
            if (params === void 0) { params = null; }
            if (json === void 0) { json = null; }
            return __generator(this, function (_a) {
                if (!this.server) {
                    throw new Error("Server was not set at init. Call findServer() first.");
                }
                if (method === "GET" && json !== null) {
                    throw new Error("GET requests cannot have a body.");
                }
                console.debug("Sending request to ".concat(path));
                if (params) {
                    params = Object.fromEntries(Object.entries(params).filter(function (_a) {
                        var _ = _a[0], v = _a[1];
                        return v != null;
                    }));
                    console.debug("Parameters: ".concat(JSON.stringify(params)));
                }
                if (json) {
                    json = Object.fromEntries(Object.entries(json).filter(function (_a) {
                        var _ = _a[0], v = _a[1];
                        return v != null;
                    }));
                    console.debug("Body: ".concat(JSON.stringify(json)));
                }
                headers = {
                    Authorization: "Bearer ".concat(this.accessToken),
                    "Content-Type": "application/json",
                    "X-Library": "node tesla_fleet_api",
                };
                query = new URLSearchParams(params).toString();
                console.log(method, headers, json, query);
                return [2, fetch("".concat(this.server, "/").concat(path).concat(query), {
                        method: method,
                        headers: headers,
                        body: JSON.stringify(json),
                    }).then(function (res) {
                        if (!res.ok) {
                            throw new Error("HTTP status code ".concat(res.status));
                        }
                        if (res.headers.get("content-type") === "application/json") {
                            return res.json();
                        }
                        return Promise.reject(res.status);
                    })];
            });
        });
    };
    TeslaFleetApi.prototype.products = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this._request("GET", "api/1/products")];
            });
        });
    };
    return TeslaFleetApi;
}());
//# sourceMappingURL=tesla-fleet-api.js.map