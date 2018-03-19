const WXPAYURL = 'https://api.mch.weixin.qq.com';
const util = require('./util');
module.exports = {
    basicConfig: {
        appid: 'test01',
        mch_id: 'test01',
        nonce_str: util.noncestr(),
        sign_type: 'MD5',
        key: 'test01',
    },
    certPath: () => {
        return null;
    },
    unifiedOrderNotifyUrl: () => {
        let notifyUrl = '';
        switch (process.env.NODE_ENV) {
            case 'dev':
                break;
            case 'test':
                break;
            case 'prod':
                break;
        }
        return notifyUrl;
    },
    PAYURL: {
        unifiedorder: `${WXPAYURL}/pay/unifiedorder`,// 统一下单
        orderquery: `${WXPAYURL}/pay/orderquery`,// 查询订单
        closeorder: `${WXPAYURL}/pay/closeorder`,// 关闭订单
        refund: `${WXPAYURL}/secapi/pay/refund`,// 申请退款
        refundquery: `${WXPAYURL}/pay/refundquery`,
    },
};