'use strict';

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var path = require('path');
var util = require('util');
var os = require('os');

var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;

var member_user_supplier_ibm = null;
var member_user_oem_lotus = null;
var member_user_bank_unionbank = null;

var member_user_supplier_lg = null;
var member_user_oem_tivoli = null;
var member_user_bank_chinabank = null;

var supplier1_secret = null;
var oem1_secret = null;
var bank1_secret = null;

var supplier2_secret = null;
var oem2_secret = null;
var bank2_secret = null;

var store_path = path.join(__dirname, 'hfc-key-store');
console.log(' Store path:'+store_path);



Fabric_Client.newDefaultKeyValueStore({ path: store_path
})
    .then((state_store) => {

        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        var	tlsOptions = {
            trustedRoots: [],
            verify: false
        };

        fabric_ca_client = new Fabric_CA_Client('http://localhost:7054', null , '', crypto_suite);
        return fabric_client.getUserContext('admin', true);
    })
        .then((user_from_store) => {
            if (user_from_store && user_from_store.isEnrolled()) {

                console.log('Successfully loaded admin from persistence');
                admin_user = user_from_store;
            } else {
                throw new Error('Failed to get admin run enrollAdmin.js');
            }

            let attributes = [
                {name:"username", value:"IBM",ecert:true } , 
                {name:"username", value:"Lotus",ecert:true } , 
                {name:"username", value:"Unionbank",ecert:true },
                {name:"username", value:"LG",ecert:true },
                {name:"username", value:"Tivoli",ecert:true },
                {name:"username", value:"Chinabank",ecert:true }];

            return fabric_ca_client
                .register({enrollmentID: 'ibm', affiliation: 'org1.department1',role: 'supplier', attrs: attributes}, admin_user)
                .then((supplier1)=>{
                    supplier1_secret = supplier1;
                    return fabric_ca_client
                        .register({enrollmentID: 'lotus', affiliation: 'org1.department1',role: 'oem', attrs: attributes}, admin_user)
                        .then((oem1)=>{
                            oem1_secret = oem1
                            return fabric_ca_client
                                .register({enrollmentID: 'unionbank', affiliation: 'org1.department1',role: 'bank', attrs: attributes}, admin_user)
                                .then((bank1)=>{
                                    bank1_secret = bank1
                                    return fabric_ca_client
                                        .register({enrollmentID: 'lg', affiliation: 'org1.department2',role: 'supplier', attrs: attributes}, admin_user)
                                        .then((supplier2)=>{
                                            supplier2_secret = supplier2
                                            return fabric_ca_client
                                                .register({enrollmentID: 'tivoli', affiliation: 'org1.department2',role: 'oem', attrs: attributes}, admin_user)
                                                .then((oem2)=>{
                                                    oem2_secret = oem2
                                                    return fabric_ca_client
                                                        .register({enrollmentID: 'chinabank', affiliation: 'org1.department2',role: 'bank', attrs: attributes}, admin_user)
                                                })
                                        })
                                })
                        })
                });
        })
            .then((bank2) => {

                bank2_secret = bank2

                // next we need to enroll the users with CA server
                console.log('Successfully registered IBM - secret:'+ supplier1_secret);
                console.log('Successfully registered Lotus - secret:'+ oem1_secret);
                console.log('Successfully registered Unionbank - secret:'+ bank1_secret);
                console.log('Successfully registered LG - secret:'+ supplier2_secret);
                console.log('Successfully registered Tivoli - secret:'+ oem2_secret);
                console.log('Successfully registered Chinabank - secret:'+ bank2_secret);
                
                return fabric_ca_client
                    .enroll({enrollmentID: 'ibm', enrollmentSecret: supplier1_secret})
                    .then(()=>{
                        return fabric_ca_client
                            .enroll({enrollmentID: 'lotus', enrollmentSecret: oem1_secret})
                            .then(()=>{
                                return fabric_ca_client
                                    .enroll({enrollmentID: 'unionbank', enrollmentSecret: bank1_secret})
                                    .then(()=>{
                                        return fabric_ca_client
                                            .enroll({enrollmentID: 'lg', enrollmentSecret: supplier2_secret})
                                            .then(()=>{
                                                return fabric_ca_client
                                                    .enroll({enrollmentID: 'tivoli', enrollmentSecret: oem2_secret})
                                                    .then(()=>{
                                                        return fabric_ca_client
                                                            .enroll({enrollmentID: 'chinabank', enrollmentSecret: bank2_secret})
                                                    })
                                            })
                                    })
                            })
                    });

            })
                .then((enrollment) => {
                console.log('Successfully enrolled member user "IBM" , "Lotus" , "Unionbank" , "LG" , "Tivoli" , "Chinabank" ');
                
                return fabric_client
                        .createUser({username: 'IBM',mspid: 'Org1MSP',cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }})
                        .then(()=>{
                            return fabric_client
                                .createUser({username: 'Lotus',mspid: 'Org1MSP',cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }})
                                .then(()=>{
                                    return fabric_client
                                    .createUser({username: 'Unionbank',mspid: 'Org1MSP',cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }})
                                    .then(()=>{
                                        return fabric_client
                                        .createUser({username: 'LG',mspid: 'Org1MSP',cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }})
                                        .then(()=>{
                                            return fabric_client
                                            .createUser({username: 'Tivoli',mspid: 'Org1MSP',cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }})
                                            .then(()=>{
                                                return fabric_client
                                                .createUser({username: 'Chinabank',mspid: 'Org1MSP',cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }})
                                                
                                            })
                                        })
                                    })
                                })
                        });

                }).then((user) => {
                    member_user_supplier_ibm = user;
                    member_user_oem_lotus = user;
                    member_user_bank_unionbank = user;
                    member_user_supplier_lg = user;
                    member_user_oem_tivoli = user;
                    member_user_bank_chinabank = user;

                    return fabric_client
                        .setUserContext(member_user_supplier_ibm)
                        .then(()=>{
                            return fabric_client
                            .setUserContext(member_user_oem_lotus)
                            .then(()=>{
                                return fabric_client
                                    .setUserContext(member_user_bank_unionbank)
                                    .then(()=>{
                                        return fabric_client
                                            .setUserContext(member_user_supplier_lg)
                                            .then(()=>{
                                                return fabric_client
                                                    .setUserContext(member_user_oem_tivoli)
                                                    .then(()=>{
                                                        return fabric_client
                                                            .setUserContext(member_user_bank_chinabank)
                                                    })
                                            })
                                    })
                            })
                        });

                }).then(()=>{
                    console.log('6 users were successfully registered and enrolled and is ready to interact with the fabric network');

                }).catch((err) => {
                    console.error('Failed to register: ' + err);
                    if(err.toString().indexOf('Authorization') > -1) {
                        console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
                        'Try again after deleting the contents of the store directory '+store_path);
                    }
                });