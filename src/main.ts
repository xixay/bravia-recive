import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//En receive.js , primero debemos solicitar la biblioteca:
import * as amqp from 'amqplib';
import axios from 'axios';
// variable de envio openvox
const envio_openvox = false;
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  const queues = await obtenerColas(true);
  const routerskeys = await obtenerColas(false);
  for (let i = 0; i < queues.length; i++) {
    const queue = queues[i];
    const routerkey = routerskeys[i];
    connect(queue, routerkey);
  }
  // recive_cola_tareas();
  // await app.listen(3001);
}
bootstrap();
async function connect(queue: string, routerkey) {
  try {
    //luego conéctese al servidor RabbitMQ
    // const connection = await amqp.connect("amqp://localhost:5672");
    const coneccion = await amqp.connect('amqp://guest:guest@localhost:5672');
    //A continuación, creamos un canal
    const canal = await coneccion.createChannel();
    // exchange
    const ex = 'direct_logs';
    // const cola = process.env.AMQP_QUEUE_SMS;
    // cola test
    // const cola = 'test_queue';
    const cola = queue;
    // router key
    // const rkey = 'test_route';
    const rkey = routerkey;
    // agregando el exchange de tipo direct
    await canal.assertExchange(ex, 'direct', { durable: true });
    // agregando la cola
    await canal.assertQueue(cola, {
      durable: true,
      maxPriority: 10,
    });
    await canal.bindQueue(cola, ex, rkey);
    canal.consume(
      cola,
      (mensaje) => {
        const secs = mensaje.content.toString().split('.').length - 1;
        const input = JSON.parse(mensaje.content.toString());
        console.log(' [x] Recibido %s', input);
        setTimeout(function () {
          console.log(' [x] Done');
        }, secs * 1000);
      },
      {
        // modo de reconocimiento automático,
        noAck: envio_openvox, // si el acuse es true, se envio al openvox
      },
    );
    console.log(
      ' [*] Esperando lo enviado por %s. Para salir presione CTRL+C',
      cola,
    );
  } catch (ex) {
    console.error(ex);
  }
}
async function obtenerColas(sw: boolean) {
  const array1 = [];
  let aux = null;
  if (sw) {
    aux = 'cola_';
  } else {
    aux = 'ruta_';
  }

  await axios
    .get('http://localhost:3000/api/entidades/nombres')
    .then((response) => {
      response.data.forEach((element) => {
        array1.push(aux + element.nombreEntidad);
      });
    })
    .catch((e) => {
      console.log(e);
    });
  console.log(array1);

  return array1;
}
