var Fabric_Client = require('fabric-client');
var path = require('path');
var util = require('util');
var os = require('os');

//
var fabric_client = new Fabric_Client();

// setup the fabric network
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);
var order = fabric_client.newOrderer('grpc://localhost:7050')
channel.addOrderer(order);

//
var store_path = path.join(__dirname, 'hfc-key-store');
console.log('Store path:'+store_path);
var tx_id = null;

const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser');
const cors = require('cors')

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/test', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

app.all('/invoice', function(req, res){    

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
// assign the store to the fabric client

fabric_client.setStateStore(state_store);
var crypto_suite = Fabric_Client.newCryptoSuite();

// use the same location for the state store (where the users' certificate are kept)
// and the crypto store (where the users' keys are kept)
var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
crypto_suite.setCryptoKeyStore(crypto_store);
fabric_client.setCryptoSuite(crypto_suite);


var sUser = req.body.username;
console.log(sUser);
// get the enrolled user from persistence, this user will sign all requests
return fabric_client.getUserContext(sUser, true);
}).then((user_from_store) => {
  console.log(user_from_store);
if (user_from_store && user_from_store.isEnrolled()) {
console.log("Successfully loaded from persistence");
member_user = user_from_store;
console.log(member_user);
} else {
  var sUser = req.body.username;
  res.json(sUser + " is not registered to do this transaction");
throw new Error( sUser + " is not registered to do this transaction");
}

// get a transaction id object based on the current user assigned to fabric client
tx_id = fabric_client.newTransactionID();
console.log("Assigning transaction_id: ", tx_id._transaction_id);

var request = {
  chaincodeId: 'invoice',
  chainId: 'mychannel',
  txId: tx_id
};

var raiseinvoice = [];
var invoiceid = req.body.invoiceid;
var invoicenum = req.body.invoicenum;
var billedto = req.body.billedto;
var invoicedate = req.body.invoicedate;
var invoiceamount = req.body.invoiceamount;
var itemdescription = req.body.itemdescription;
var gr = req.body.gr;
var ispaid = req.body.ispaid;
var paidamount = req.body.paidamount;
var repaid = req.body.repaid;
var repaymentamount = req.body.repaymentamount;

raiseinvoice.push(invoiceid);
if (req.method == "POST")
{
  var sUser = req.body.username;

  // IBM is our Supplier
  // This should not let other registered users to do this transaction
  if(sUser != "IBM" ){
    
    res.json(sUser + " is not allowed to do this transaction");
    throw new Error(sUser + " is not allowed to do this transaction");
  }

  else{
    // gr = 'false';
    // ispaid = 'false';
    // paidamount = '0';
    // repaid = 'false';
    // repaymentamount = '0';

    request.fcn='raiseInvoice';
    raiseinvoice.push(invoicenum);
    raiseinvoice.push(billedto);
    raiseinvoice.push(invoicedate);
    raiseinvoice.push(invoiceamount); 
    raiseinvoice.push(itemdescription);
    // raiseinvoice.push(gr); 
    // raiseinvoice.push(ispaid);
    // raiseinvoice.push(paidamount); 
    // raiseinvoice.push(repaid);
    // raiseinvoice.push(repaymentamount); 
  }
}

else if(req.method == "PUT")
{
    if(gr)
    {
        // Lotus is our OEM
        // This should not let other registered users to do this transaction
          var sUser = req.body.username;

          if(sUser != "Lotus"){
            res.json(sUser + " is not allowed to do this transaction");
            throw new Error(sUser + " is not allowed to do this transaction");
          }

          else{
            //UPDATE state if goods are received
            //DEFAULT state is No
            request.fcn= 'receivedGoods',
            raiseinvoice.push(gr);
          }
    }
    
    else if(paidamount)
    {
          var sUser = req.body.username;

          // Unionbank is our bank
          // This should not let other registered users to do this transaction
          if(sUser != "Unionbank"){
            res.json(sUser + " is not allowed to do this transaction");
            throw new Error(sUser + " is not allowed to do this transaction");
          }

          else{
            //UPDATE state if banks already paid the supplier
            //DEFAULT state is No
            request.fcn= 'paymentToSupplier',
            //ispaid = 'Y';
            raiseinvoice.push(paidamount);
            //raiseinvoice.push(ispaid);
          }
    }

    else if(repaymentamount)
    {
        var sUser = req.body.username;


        if(sUser != "Lotus"){
          // Lotus and Tivoli is our OEM
          // This should not let other registered users to do this transaction
          res.json(sUser + " is not allowed to do this transaction");
          throw new Error(sUser + " is not allowed to do this transaction");
        }

        else{
          
          //UPDATE state if OEM already repaid the bank
          //DEFAULT state is No
          request.fcn= 'paymentToBank',
          //repaid = "Y";
          raiseinvoice.push(repaymentamount);
          //raiseinvoice.push(repaid);
        }
    }
}

request.args=raiseinvoice;
console.log(request);

// // return 
res.json({
  Function: request.fcn,
  Inputs: request.args,
  Result: "Success"
});

// send the transaction proposal to the peers
return channel.sendTransactionProposal(request);
}).then((results) => {
var proposalResponses = results[0];
var proposal = results[1];
let isProposalGood = false;
if (proposalResponses && proposalResponses[0].response &&
proposalResponses[0].response.status === 200) {
isProposalGood = true;
console.log('Transaction proposal was good');
} else {
console.error('Transaction proposal was bad');
}
if (isProposalGood) {
console.log(util.format(
'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s"',
proposalResponses[0].response.status, proposalResponses[0].response.message));

// build up the request for the orderer to have the transaction committed
var request = {
proposalResponses: proposalResponses,
proposal: proposal
};

// set the transaction listener and set a timeout of 30 sec
// if the transaction did not get committed within the timeout period,
// report a TIMEOUT status
var transaction_id_string = tx_id.getTransactionID(); //Get the transaction ID string to be used by the event processing
var promises = [];

var sendPromise = channel.sendTransaction(request);
promises.push(sendPromise); //we want the send transaction first, so that we know where to check status

// get an eventhub once the fabric client has a user assigned. The user
// is required bacause the event registration must be signed
let event_hub = channel.newChannelEventHub(peer);

// using resolve the promise so that result status may be processed
// under the then clause rather than having the catch clause process
// the status
let txPromise = new Promise((resolve, reject) => {
let handle = setTimeout(() => {
event_hub.unregisterTxEvent(transaction_id_string);
event_hub.disconnect();
resolve({event_status : 'TIMEOUT'}); //we could use reject(new Error('Trnasaction did not complete within 30 seconds'));
}, 3000);
event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
// this is the callback for transaction event status
// first some clean up of event listener
clearTimeout(handle);

// now let the application know what happened
var return_status = {event_status : code, tx_id : transaction_id_string};
if (code !== 'VALID') {
console.error('The transaction was invalid, code = ' + code);
resolve(return_status); // we could use reject(new Error('Problem with the tranaction, event status ::'+code));
} else {
console.log('The transaction has been committed on peer ' + event_hub.getPeerAddr());
resolve(return_status);
}
}, (err) => {
//this is the callback if something goes wrong with the event registration or processing
reject(new Error('There was a problem with the eventhub ::'+err));
},
{disconnect: true} //disconnect when complete
);
event_hub.connect();

});
promises.push(txPromise);

return Promise.all(promises);
} else {
console.error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
throw new Error('Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...');
}
}).then((results) => {
console.log('Send transaction promise and event listener promise have completed');
// check the results in the order the promises were added to the promise all list
if (results && results[0] && results[0].status === 'SUCCESS') {
console.log('Successfully sent transaction to the orderer.');
} else {
console.error('Failed to order the transaction. Error code: ' + results[0].status);
}

if(results && results[1] && results[1].event_status === 'VALID') {
console.log('Successfully committed the change to the ledger by the peer');
                // res.json({'result': 'success'});
} else {
console.log('Transaction failed to be committed to the ledger due to ::'+results[1].event_status);
}
}).catch((err) => {
console.error('Failed to invoke :: ' + err);
});


})

app.get('/', function (req, res) {

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {

// assign the store to the fabric client
fabric_client.setStateStore(state_store);
var crypto_suite = Fabric_Client.newCryptoSuite();

// use the same location for the state store (where the users' certificate are kept)
// and the crypto store (where the users' keys are kept)
var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
crypto_suite.setCryptoKeyStore(crypto_store);
fabric_client.setCryptoSuite(crypto_suite);

// get the enrolled user from persistence, this user will sign all requests
var sUser = req.body.username;
console.log(sUser);

return fabric_client.getUserContext(sUser, true);
}).then((user_from_store) => {
  console.log(user_from_store);
if (user_from_store && user_from_store.isEnrolled()) {
//console.log("Successfully loaded " + sUser +" from persistence");
member_user = user_from_store;
} else {
  var sUser = req.body.username;
  res.json(sUser + " is not registered to do this transaction");
throw new Error(sUser + "  is not registered to do this transaction");
}

// displayAllInvoices chaincode function - requires no arguments , ex: args: [''],
const request = {

//targets : --- letting this default to the peers assigned to the channel
chaincodeId: 'invoice',
fcn: 'displayAllInvoices',
args: ['']
};

var ar = [];
var attr = req.query.attr;
var invoice = req.query.invoice;

if (attr){
  
  ar.push(attr);
  request.fcn='getUser';
  request.args = ar;
}

else if (invoice)
{
  ar.push(invoice);
  request.fcn='getInvoiceAuditHistory';
  request.args = ar;
}




// send the query proposal to the peer
return channel.queryByChaincode(request);
}).then((query_responses) => {
console.log("Query has completed, checking results");
// query_responses could have more than one  results if there multiple peers were used as targets
if (query_responses && query_responses.length == 1) {
if (query_responses[0] instanceof Error) {
console.error("error from query = ", query_responses[0]);
} else {
console.log("Response is ", query_responses[0].toString());
                        res.send(query_responses[0].toString());
}
} else {
console.log("No payloads were returned from query");
}
}).catch((err) => {
console.error('Failed to query successfully :: ' + err);
});
})

app.get('/block', function (req, res) {

  var sUser = req.body.username;
  // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
  Fabric_Client.newDefaultKeyValueStore({ path: store_path
  }).then((state_store) => {
  // assign the store to the fabric client
  fabric_client.setStateStore(state_store);
  var crypto_suite = Fabric_Client.newCryptoSuite();
  // use the same location for the state store (where the users' certificate are kept)
  // and the crypto store (where the users' keys are kept)
  var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
  crypto_suite.setCryptoKeyStore(crypto_store);
  fabric_client.setCryptoSuite(crypto_suite);
  
  // get the enrolled user from persistence, this user will sign all requests
  return fabric_client.getUserContext(sUser, true);
  }).then((user_from_store) => {
    console.log(user_from_store);
  if (user_from_store && user_from_store.isEnrolled()) {
  console.log("Successfully loaded" + sUser + "from persistence");
  member_user = user_from_store;
  } else {
  throw new Error("Failed to get run registerUser.js");
  }

  
  return channel.queryInfo(peer,false);
  }).then((blockInfo) => {
    console.log("height:"+blockInfo.height);

    return channel.queryBlock((blockInfo.height-1 ),peer,false);
  }).then((block) => {
    let payload = block.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[0].rwset.writes[0];
    res.send(payload);      
  });
  });

  function unicodeToChar(text) {
    return text.replace(/\\u[\dA-F]{4}/gi, 
           function (match) {
                return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
           });
 }
  


  
  