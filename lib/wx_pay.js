const _request = Symbol('_request');
const _formatParams = Symbol('formatParams');
const request = require('request');
const fs = require('fs');
const querystring = require('querystring');

const config = require('./config');
const util = require('./util');

class WxPay {
    constructor() {
        this.basicObj = config.basicConfig;
        this.certPath = config.certPath();
        this.PAYURL = config.PAYURL;
        this.unifiedOrderNotifyUrl = config.unifiedOrderNotifyUrl();
    }

    async [_request](xmlObj, type, cert = false) {
        let stringXml = util.xml2jsBuild(xmlObj);
        let url = this.PAYURL[type];
        if (!url) {
            throw new Error('参数错误');
        }
        let requestOptions = {
            url: url,
            method: 'post',
            body: stringXml,
        };
        if (cert) {
            requestOptions['agentOptions'] = {
                pfx: fs.readFileSync(this.certPath),
                passphrase: this.basicObj['mch_id']
            }
        }
        return new Promise((resolve, reject) => {
            request(requestOptions, (err, response, body) => {
                if (err) {
                    return reject(err);
                }
                resolve(body);
            });
        });
    }

    /**
     * 统一下单
     * @param trade_type 交易类型
     * @param spbill_create_ip 设备ip
     * @param total_fee 总金额
     * @param out_trade_no 商户订单号
     * @param body 商品描述
     * @returns {Promise<*>}
     */
    async order(trade_type, spbill_create_ip, total_fee, out_trade_no, body) {
        if (arguments.length !== 5) {
            throw new Error('缺少参数，请检查参数！');
        }
        let unifiedOrderNotifyUrl = this.unifiedOrderNotify_url;
        let xmlObj = this[_formatParams]({
            trade_type,
            spbill_create_ip,
            total_fee,
            out_trade_no,
            body,
            notify_url: unifiedOrderNotifyUrl,
        });
        let responseData = await this[_request](xmlObj, 'unifiedorder');
        return await util.parseString(responseData);
    }

    /**
     * 支付结果通知
     * @param xmlBody
     * @returns {Promise<*>}
     */
    async responseNotify(xmlBody) {
        let body = await util.parseString(xmlBody)
        let {out_trade_no, sign, total_fee, nonce_str, result_code, err_code, err_code_des, time_end, transaction_id} = body.xml;
        // 订单号，签名，金额，随机串，结果，错误代码，错误代码描述，结束时间，微信订单号
        console.log('body:', body);
        let responseBody = {return_code: 'SUCCESS', return_msg: 'OK'};
        return util.xml2jsBuild(responseBody);
    }

    /**
     * 订单查询
     * @param params （out_trade_no 商户单号 || transaction_id 微信订单号）
     * @param needsParams
     * @returns {Promise<*>}
     */
    async orderQuery(params, needsParams = ['transaction_id|out_trade_no']) {
        let missParams = needsParams.file(key => !key.split('|').some(key => params[key]))
        if (missParams.length) {
            throw new Error('缺少参数：', missParams.join(','));
        }
        let xmlObj = this[_formatParams](params);
        let responseData = await this[_request](xmlObj, 'orderquery');
        return await util.parseString(responseData);
    }

    /**
     * 关闭订单
     * @param out_trade_no
     * @returns {Promise<void>}
     */
    async closeOrder(out_trade_no) {
        if (!out_trade_no) {
            throw new Error('缺少参数！');
        }
        let xmlObj = this[_formatParams](params);
        let responseData = await this[_request](xmlObj, 'closeorder');
        return await util.parseString(responseData);
    }

    /**
     * 申请退款
     * @param params（out_trade_no 商户单号 || transaction_id 微信订单号  &&  out_refund_no 商户退款单号）
     * @param needsParam
     * @returns {Promise<*>}
     */
    async refund(params, needsParam = ['transaction_id|out_trade_no']) {
        let missParams = params.filter(v => !v.some(v => params[v]));
        if (missParams.length) {
            throw new Error('缺少参数！');
        }
        let xmlObj = this[_formatParams](params);
        let responseData = await this[_request](xmlObj, 'refund', true);
        return await util.parseString(responseData);
    }

    /**
     * 退款通知
     * @param xmlBody
     * @returns {Promise<void>}
     */
    async refundResponse(xmlBody) {

    }

    /**
     * 退款查询
     * @param params（out_trade_no 商户单号 || transaction_id 微信订单号 || refund_id 微信退款单号 || out_refund_no 商户退款单号）
     * @param needsParams
     * @returns {Promise<void>}
     */
    async refundQuery(params, needsParams = ['refund_id|out_refund_no|transaction_id|out_trade_no']) {
        let missParams = needsParams.filter((v) => !v.some(v => params[v]));
        if (missParams.length) {
            throw new Error('缺少参数！');
        }
        let xmlObj = this[_formatParams](params);
        let responseData = await this[_request](xmlObj, 'refundquery');
        return await util.parseString(responseData);
    }

    /**
     * 退款结果
     * @param xmlBody
     * @returns {Promise<void>}
     */
    async responseRefund(xmlBody) {
        let {req_info} = await util.parseString(xmlBody)
        let responseData = util.dencryted(this.basicObj.key, req_info);
    }

    /**
     * 格式化参数
     * @param params
     * @returns xmlObj
     */
    [_formatParams](params) {
        let basicObj = {...params, ...this.basicObj};
        delete basicObj.key;
        let keys = Object.keys(basicObj).sort();
        let stringA = [];
        keys.forEach((v) => {
            stringA.push(`${v}=${basicObj[v]}`);
        });
        stringA.push(`key=${this.basicObj.key}`);
        stringA = stringA.join('&');
        let signature = util.MD5(stringA).toUpperCase();

        let xmlObj = querystring.parse(stringA);
        delete xmlObj.key;
        xmlObj.sign = signature;
        return xmlObj;
    }

}

module.exports = () => {
    if (!(this instanceof WxPay)) {
        return new WxPay();
    }
    return WxPay();
};