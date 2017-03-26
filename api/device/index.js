var util = require("util");
var config = require("../config");
var requestHelper = require("../helpers/request");

var getDeviceList = function(accountId, token, callback){
	var url = util.format("%s/accounts/%s/devices", config.base_url, accountId);
	requestHelper.makeRequest(requestHelper.makeOptions(url, "GET",'', token), callback);
};

module.exports = {
    getDeviceList: getDeviceList
};