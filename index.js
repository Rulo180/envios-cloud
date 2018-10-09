var AWS = require('aws-sdk');

var handler = function(event, context, callback) {
  var dynamodb = new AWS.DynamoDB({
    apiVersion: '2012-08-10',
    endpoint: 'http://dynamodb:8000',
    region: 'us-west-2',
    credentials: {
      accessKeyId: '2345',
      secretAccessKey: '2345'
    }
  });

  var docClient = new AWS.DynamoDB.DocumentClient({
     apiVersion: '2012-08-10',
     service: dynamodb
  });

  switch (event.httpMethod) {
    case "GET":
      switch (event.resource) {
        case "/envios/pendientes":
          // scan indice pendientes
          
          var params2 = {
            TableName: 'Envio',
            // FilterExpression: "pendiente = ''",
            AttributesToGet :['id','pendiente'],
          };
        docClient.scan(params2, function(err, data) {
          if (err) {
                callback(null, {
                  statusCode: 500, body: JSON.stringify(err)
                });
              } else {
                callback(null, {
                  statusCode: 201,
                  body: JSON.stringify(data)
                })
              }
        });

          break;
        // get por id
        case "/envios/{idEnvio}":
        let idEnvio = (event.pathParameters || {}).idEnvio || false;
        var params3 = {
          TableName: 'Envio',
          Key:{id: idEnvio} ,
      };
      docClient.get(params3, function(err, data) {
        if (err) {
          callback(null, {
            statusCode: 500, body: JSON.stringify(err)
          });
        } else {
          callback(null, {
            statusCode: 201,
            body: JSON.stringify(data)
          })
        }
      });
          break;
      }
      break;
    case "POST":
      let body = JSON.parse(event.body);
      var item = body;

      switch (event.resource) {
        case "/envios":
          // crear
          item.fechaAlta = new Date().toISOString();
          item.pendiente = item.fechaAlta;
          item.id = guid();

          console.log('item', item);

          docClient.put({
            TableName: 'Envio',
            Item: item
          }, function(err, data) {
            if (err) {
              callback(null, {
                statusCode: 500, body: JSON.stringify(err)
              });
            } else {
              callback(null, {
                statusCode: 201,
                body: JSON.stringify(item)
              })
            }
          });

          break;
        case "/envios/{idEnvio}/movimiento":
          // agregar movimiento
          // 1) traer por id
          let idEnvio2 = (event.pathParameters || {}).idEnvio2 || false;
          let body = JSON.parse(event.body);
          var descripcion = body;
          // var fecha = new Date().toISOString();
          //hacer un get del item , si lo trae , pushearle el movimiento 
          // 2) agregamos historial
          docClient.update({
            TableName: 'Envio',
            Key:{
              'id':idEnvio2
            },
            UpdateExpression: 'set historial = :h',
            ExpressionAttributeValues:{
              // ':h':[descripcion,fecha]
              ':h':[descripcion]
            },
            ReturnValues:"UPDATED_NEW"
            

          }, function(err, data) {
            if (err) {
              callback(null, {
                statusCode: 500, body: JSON.stringify(err)
              });
            } else {
              callback(null, {
                statusCode: 201,
                body: JSON.stringify(item)
              })
            }
          });

          // 3) put para guardar
          break;
        case "/envios/{idEnvio}/entregado":
          // marcar entregado
          // 1) traer por id
          // 2) borrar atributo pendiente
          // 3) put para guardar

          let idEnvio3 = (event.pathParameters || {}).idEnvio3 || false;
          let EnvioGet 
          var params3 = {
            TableName: 'Envio',
            Key:{id: idEnvio3} ,
        };
          docClient.get(params3, function(err, data) {
          if (err) {
            callback(null, {
              statusCode: 500, body: JSON.stringify(err)
            });
          } else {
            callback(null, {
              statusCode: 201,
              body: JSON.stringify(data)
            }),
            docClient.update(params, function(err, data) {
              if (err) ppJson(err); // an error occurred
              else ppJson(data); // successful response
            });
            
            
          }
        });
          
          // docClient.update({
          //   TableName: 'Envio',
          //   Key:{
          //     'id':EnvioGet.id
          //   },
          //   UpdateExpression: 'delete pendiente = :p',
          //   ExpressionAttributeValues:{
          //     ':p':[EnvioGet.pendiente]
          //   },
          //   ReturnValues:"UPDATED_NEW"
            

          // }, function(err, data) {
          //   if (err) {
          //     callback(null, {
          //       statusCode: 500, body: JSON.stringify(err)
          //     });
          //   } else {
          //     callback(null, {
          //       statusCode: 201,
          //       body: JSON.stringify(item)
          //     })
          //   }
          // });

          break;
      }
      break;
    default:
      callback(null, {
        statusCode: 405
      });
  }

}

// function isEmpty(a){
//    return(!a || 0 === a.length);   
// }

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

exports.handler = handler;