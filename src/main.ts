import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
//En receive.js , primero debemos solicitar la biblioteca:
import * as amqp from 'amqplib';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  connect();
  // await app.listen(3001);
}
bootstrap();
async function connect() {
  try {
    //luego conéctese al servidor RabbitMQ
    // const connection = await amqp.connect("amqp://localhost:5672");
    const coneccion = await amqp.connect('amqp://guest:guest@localhost:5672');
    //A continuación, creamos un canal
    const canal = await coneccion.createChannel();
    const cola = 'cola_de_sms';
    await canal.assertQueue(cola);
    canal.consume(cola, (mensaje) => {
      const input = JSON.parse(mensaje.content.toString());
      // const input = message.content.toString();
      console.log(' [x] Recibido %s', input);
      canal.ack(mensaje);
    });
    console.log(
      ' [*] Esperando lo enviado por %s. Para salir presione CTRL+C',
      cola,
    );
  } catch (ex) {
    console.error(ex);
  }
}
