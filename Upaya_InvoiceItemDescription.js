/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
* @ FILENAME      : Upaya_Suitelet_Invoice_Consolidation.js 
* @ AUTHOR        : eliseo@upayasolutions.com
* @ DATE          : 16th May 2016
*
* Copyright (c) 2012 Upaya - The Solution Inc. 
* 10530 N. Portal Avenue, Cupertino CA 95014
* All Rights Reserved.
*
* This software is the confidential and proprietary information of 
* Upaya - The Solution Inc. ("Confidential Information"). You shall not
* disclose such Confidential Information and shall use it only in
* accordance with the terms of the license agreement you entered into
* with Upaya.
* object
* @ DESCRIPTION : Deployed on Invoice Record only in 'create' event
* The script will look for items in the billable line and search for the description field in the Bill record's description field and use that as the memo in the Invoice record.
*/

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 * 
 * @param {String} type Operation types: create, edit, delete, xedit,
 *                      approve, cancel, reject (SO, ER, Time Bill, PO & RMA only)
 *                      pack, ship (IF only)
 *                      dropship, specialorder, orderitems (PO only) 
 *                      paybills (vendor payments)
 * @returns {Void}
 */
var userEventAfterSubmit = function(type)
{
  if(type == 'create')
  {
	  var rec = nlapiLoadRecord(nlapiGetRecordType(), nlapiGetRecordId());
	  var count = rec.getLineItemCount('itemcost');
	  var isModified = false;
	  
	  if(count > 0)
	  {
		  for(var i = 1; i <= count; i++)
		  {
			  var doc = rec.getLineItemValue('itemcost', 'doc', i);
			  var item = rec.getLineItemValue('itemcost', 'item', i);
			  var job = rec.getLineItemValue('itemcost', 'job', i);
			  
			  var billMemo = getLineItemDesc(item, doc, job);
			  alert(billMemo);
			  
			  if(billMemo != "")
			  {
				  rec.setLineItemValue('itemcost', 'memo', i, billMemo);
				  isModified = true;
			  }
		  }
	  }
	  
	  if(isModified == true)
	  {
		  try
		  {
			  nlapiSubmitRecord(rec);
		  }
		  catch(error)
		  {
		  	if(error.getDetails != undefined)
		  	{
		  		LogError(error.getCode() + ': ' + error.getDetails());
		  		throw error;
		  	}
		  	else
		  	{
		  		LogError(error.toString());
		  		throw nlapiCreateError('99999', error.toString());
		  	}
		  }		  
	  }
  }
}


var getLineItemDesc = function(item, vendorBillId, job)
{
	var memo = "";
	var filters =
	[
		new nlobjSearchFilter('item', 'transaction', 'is', item),
		new nlobjSearchFilter('billable', 'transaction', 'is', 'T'),
		new nlobjSearchFilter('internalid', 'transaction', 'is', vendorBillId),
		new nlobjSearchFilter('internalid', null, 'is', job)
	];
	var columns =
	[
		new nlobjSearchColumn('memo', 'transaction')
	];
	
	var s = nlapiSearchRecord('job',null, filters, columns);
	
	if(s)
	{
		memo = s[0].getValue('memo', 'transaction');
	}
	
	return memo;
}