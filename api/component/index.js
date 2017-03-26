var util = require("util");
var config = require("../config");
var requestHelper = require("../helpers/request");

var getComponentList = function(accountId, token, callback){
    var url = util.format("%s/accounts/%s/cmpcatalog", config.base_url, accountId);
    requestHelper.makeRequest(requestHelper.makeOptions(url, "GET",'', token), callback);
};

module.exports = {
    getComponentList: getComponentList
};