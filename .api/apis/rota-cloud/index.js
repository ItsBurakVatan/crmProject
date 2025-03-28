import OasModule from 'oas'; // OasModule olarak adlandırdık
import APICoreModule from 'api/dist/core/index.js'; // APICoreModule olarak adlandırdık
import definition from './openapi.json' with { type: "json" };

const Oas = OasModule.default; // Oas’ın default export’unu aldık
const APICore = APICoreModule.default; // APICore’un default export’unu aldık

console.log('Oas:', Oas); // Yapıyı tekrar doğrulayalım
console.log('APICore:', APICore);

class SDK {
    constructor() {
        this.spec = Oas.init(definition); // Oas.init kullanıyoruz
        this.core = new APICore(this.spec, 'rota-cloud/3.1.0 (api/6.1.3)'); // new APICore
        this.server('https://restapi.rotacloud.net/v3.1.0/api'); // Base URL’yi burada tanımlıyoruz
    }

    config(config) {
        this.core.setConfig(config);
    }

    auth(...values) {
        this.core.setAuth(...values);
        return this;
    }

    server(url, variables = {}) {
        this.core.setServer(url, variables);
    }

    getChkList(metadata) {
        return this.core.fetch('/chk/list', 'get', metadata);
    }

    postChkAdd(body) {
        return this.core.fetch('/chk/add', 'post', body);
    }

    putChkUpdate(body) {
        return this.core.fetch('/chk/update', 'put', body);
    }

    getChkActions(body, metadata) {
        return this.core.fetch('/chk/actions', 'get', body, metadata);
    }

    getChkGetbalance(body, metadata) {
        return this.core.fetch('/chk/getBalance', 'get', body, metadata);
    }

    getChkTurmob(metadata) {
        return this.core.fetch('/chk/turmob', 'get', metadata);
    }

    getStkList(metadata) {
        return this.core.fetch('/stk/list', 'get', metadata);
    }

    postStkAdd(body) {
        return this.core.fetch('/stk/add', 'post', body);
    }

    putStkUpdate(body) {
        return this.core.fetch('/stk/update', 'put', body);
    }

    getStkWarehousebalance(metadata) {
        return this.core.fetch('/stk/warehouseBalance', 'get', metadata);
    }

    getStkWarehouseitembalance(metadata) {
        return this.core.fetch('/stk/warehouseItemBalance', 'get', metadata);
    }

    getStkActions(metadata) {
        return this.core.fetch('/stk/actions', 'get', metadata);
    }

    getOrderList(metadata) {
        return this.core.fetch('/order/list', 'get', metadata);
    }

    postOrderAdd(body) {
        return this.core.fetch('/order/add', 'post', body);
    }

    putOrderUpdate(body) {
        return this.core.fetch('/order/update', 'put', body);
    }

    getIrsaliyeList(metadata) {
        return this.core.fetch('/irsaliye/list', 'get', metadata);
    }

    getInvoicesList(metadata) {
        return this.core.fetch('/invoices/list', 'get', metadata);
    }

    getFinanceListreceipt(metadata) {
        return this.core.fetch('/finance/listReceipt', 'get', metadata);
    }

    postFinanceAddreceipt(body) {
        return this.core.fetch('/finance/addReceipt', 'post', body);
    }

    postFinanceUpdatereceipt(body) {
        return this.core.fetch('/finance/updateReceipt', 'post', body);
    }

    getEFaturaView(metadata) {
        return this.core.fetch('/e-fatura/view', 'get', metadata);
    }

    getPharmacyView(metadata) {
        return this.core.fetch('/pharmacy/view', 'get', metadata);
    }

    getCampaignList(metadata) {
        return this.core.fetch('/campaign/list', 'get', metadata);
    }

    getexchangerate(metadata) {
        return this.core.fetch('/getExchangeRate', 'get', metadata);
    }

    getVariantList(metadata) {
        return this.core.fetch('/variant/list', 'get', metadata);
    }

    getModelList(metadata) {
        return this.core.fetch('/model/list', 'get', metadata);
    }

    getLogList(metadata) {
        return this.core.fetch('/log/list', 'get', metadata);
    }

    postLogin(body) {
        return this.core.fetch('/login', 'post', body);
    }
}

const createSDK = (() => { return new SDK(); })();
export default createSDK;
