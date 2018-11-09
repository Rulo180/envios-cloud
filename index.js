var AWS = require("aws-sdk");

var handler = function(event, context, callback) {
  var dynamodb = new AWS.DynamoDB({
    apiVersion: "2012-08-10",
    endpoint: "http://dynamodb:8000",
    region: "us-west-2",
    credentials: {
      accessKeyId: "2345",
      secretAccessKey: "2345"
    }
  });

  var docClient = new AWS.DynamoDB.DocumentClient({
    apiVersion: "2012-08-10",
    service: dynamodb
  });

  switch (event.httpMethod) {
    case "GET":
      switch (event.resource) {
        case "/envios/pendientes":
          // scan indice pendientes

          var params2 = {
            TableName: "Envio",
            // FilterExpression: "pendiente = ''",
            AttributesToGet: ["id", "pendiente"]
          };
          docClient.scan(params2, function(err, data) {
            if (err) {
              callback(null, {
                statusCode: 500,
                body: JSON.stringify(err)
              });
            } else {
              callback(null, {
                statusCode: 201,
                body: JSON.stringify(data)
              });
            }
          });

          break;
        // get por id
        case "/envios/{idEnvio}":
          let idEnvio = (event.pathParameters || {}).idEnvio || false;
          var params3 = {
            TableName: "Envio",
            Key: { id: idEnvio }
          };
          docClient.get(params3, function(err, data) {
            if (err) {
              callback(null, {
                statusCode: 500,
                body: JSON.stringify(err)
              });
            } else {
              callback(null, {
                statusCode: 201,
                body: JSON.stringify(data)
              });
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

          console.log("item", item);

          docClient.put(
            {
              TableName: "Envio",
              Item: item
            },
            function(err, data) {
              if (err) {
                callback(null, {
                  statusCode: 500,
                  body: JSON.stringify(err)
                });
              } else {
                callback(null, {
                  statusCode: 201,
                  body: JSON.stringify(item)
                });
              }
            }
          );

          break;
        case "/envios/{idEnvio}/movimiento":
          // console.log('Entro al ENDPOINT')
          let idEnvio = (event.pathParameters || {}).idEnvio || false;
          let body = JSON.parse(event.body);
          let movimiento = body;
          docClient.get(
            {
              TableName: "Envio",
              Key: { id: idEnvio }
            },
            function(err, data) {
              if (err) {
                console.log('ENTRO AL ERR',data)
                callback(null, {
                  statusCode: 500,
                  body: JSON.stringify(err)
                });
              } else {
                let envio = data.Item
                if (!envio.historial) envio.historial = [];
                movimiento.fecha = new Date().toISOString();
                envio.historial.push(movimiento);
                console.log('Movimiento:',movimiento)
                docClient.put(
                  {
                    TableName: "Envio",
                    Item: envio
                  },
                  function(err, data) {
                    if (err) {
                      console.log(data)
                      callback(null, {
                        statusCode: 500,
                        body: JSON.stringify(err)
                      });
                    } else {
                      callback(null, {
                        statusCode: 201,
                        body: JSON.stringify(item)
                      });
                    }
                  }
                );
              }
            }
          );
          break;
        case "/envios/{idEnvio}/entregado":
		  // marcar entregado
		  let idEnvio = (event.pathParameters || {}).idEnvio || false;
		  let params = {
			TableName: 'Envio',
			Key: {
			  id: idEnvio || false,
			},
			ConsistentRead: false,
			ReturnConsumedCapacity: 'NONE',
		  };
		  docClient.get(
			params,
			function(error, data) {
				if (error) {
					callback(null, {
						statusCode: 500,
						body: JSON.stringify(err)
					});
				} else {
					let params = {
						TableName: 'Envio',
						Key: {
						  id: idEnvio || false,
						},
						UpdateExpression: 'set #historial = list_append(if_not_exists(#historial, :empty_list), :movimiento) remove #pendiente',
						ExpressionAttributeNames: {
						  '#historial': 'historial',
						  '#pendiente': 'pendiente'
						},
						ExpressionAttributeValues: { 
						  ':movimiento': [{fecha:new Date().toISOString(),descripcion:"Entregado"}],
						  ':empty_list': []
						},
						ReturnValues: 'ALL_NEW'
					  };
					docClient.update(params, functionDefault);
				}
			}
		  );
          break;
      }
      break;
    default:
      callback(null, {
        statusCode: 405
      });
  }
};

// function isEmpty(a){
//    return(!a || 0 === a.length);
// }

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

exports.handler = handler;
