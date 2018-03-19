'use strict';

const crypto = require('crypto');
const xml2js = require('xml2js');

/**
 * 随机字符串
 * @returns {string}
 */
const noncestr = () => {
    return Math.random().toString(36).substr(2, 15);
};
// 加密支持md5 和 HMAC 本包使用默认 md5
const MD5 = (data) => {
    return crypto.createHash('md5').update(data).digest('hex');
};

const HMAC = (data, key) => {
    return crypto.createHmac('sha256', key).update(data).digest('hex');
};

// 解密退款通知
const dencryted = (key, data) => {
    let dcipher = crypto.createDecipher('aes-128-ecb', key);
    let dencryted = dcipher.update(data, 'base64', 'utf8');
    dencryted += dcipher.final('utf8');
    return dencryted;
};

// xml=>json
const parseString = (xml) => {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};
// json=>xml
const xml2jsBuild = (json) => {
    return (new xml2js.Builder({rootName: 'xml'})).buildObject(json);
};

module.exports = {
    noncestr,
    MD5,
    HMAC,
    dencryted,
    parseString,
    xml2jsBuild,
};