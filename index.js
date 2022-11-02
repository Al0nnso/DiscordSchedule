const express = require('express');
const nodeSchedule = require('node-schedule');

const database = require('./database')

const app = express();
const path = require('path');

const axios = require('axios')

app.use(express.json());

const getError=(text)=>{
    return {error:true,message:text}
}

const sendDiscordMsg=async (text,webhook)=>{
    await axios.post(webhook, JSON.stringify({
        "content":text
    }), {
    headers: {
        'Content-Type': 'application/json'
    }
    }).then(res=> console.log(res))
    .catch(err => console.error(err));
}

const generateDate=(date,time)=>{
    time=time.split(':')
    date=date.split('/')
    if(date.length == 2 && parseInt(date[1])<=12 && parseInt(date[0])<=31){

        if(time.length == 2 && parseInt(time[0])<=23 && parseInt(time[1])<=59){
            return DT={
                minute: parseInt(time[1]),
                hour: parseInt(time[0]),
                date: parseInt(date[0]),
                month: parseInt(date[1])-1,
            }

            //let stringDate = `* ${DT.minute} ${DT.hour} ${DT.date} ${DT.month} *`
            //return stringDate
        }else{
            throw new Error('Formato de tempo errado, você deve colocar desta forma 10:00 ( hora:minuto )');
        }
    }else{
        throw new Error('Formato de data errada, você deve colocar desta forma 2022-10-30 ( dia/mes )')
    }
}

const agendarMsg = async(dateTime,text,title,webhook)=>{

    let rule = new nodeSchedule.RecurrenceRule();
    rule.tz = 'America/Sao_Paulo';

    const job = nodeSchedule.scheduleJob(title,dateTime, () => {
        sendDiscordMsg(text,webhook)
        console.log('message : '+text)
    });

    nodeSchedule.scheduledJobs[title].text=text
    nodeSchedule.scheduledJobs[title].webhook=webhook

    return('mensagem agendada! - '+job.nextInvocation())
}

app.post('/messages/add', async(req, res) => {

    console.log(req.body)

    if(!req.body || !req.body.title || !req.body.text || !req.body.date || !req.body.time || !req.body.webhook ){
        return res.send(getError('Erro, envie (title,text,date,time,webhook) para agendar a mensagem'))
    }

    try{
        const dateTime=generateDate(req.body.date,req.body.time)
        console.log(dateTime)

        const msgAgendada = agendarMsg(dateTime,req.body.text,req.body.title,req.body.webhook)

        await database.discord.add({
            title:req.body.title,
            text:req.body.text,
            dateTime,
            webhook:req.body.webhook,
        })

        return res.send(msgAgendada)
    }catch(err){
        return res.send(getError(err.message))
    }
})

app.get('/messages/teste', async(req, res) => {
    const messages = await database.discord.get()

    res.send(messages);
})

app.get('/messages', (req, res) => {
    let jobs = nodeSchedule.scheduledJobs

    //console.log(jobs)

    var messages = []
    
    Object.values(jobs).forEach(job => {
        messages.push({
            name:job.name,
            date:job.nextInvocation(),
            text:job.text,
            webhook:job.webhook
        })
    });

    res.send(messages);
});

app.post('/messages/del', async(req, res) => {

    if(req.body.name){
        try{
            var job = nodeSchedule.scheduledJobs[req.body.name];
            job.cancel();

            const messages = await database.discord.get()
            const key = Object.keys(messages).find(msg => messages[msg].title === req.body.name)

            await database.discord.remove(messages[key].id)

            res.send('Mensagem ( '+req.body.name+' ) cancelada');
        }catch(e){
            console.log(e.message)
            res.send(getError('O nome da mensagem é invalido!'));           
        }

    }else{
        //res.statusCode = 400;
        res.send(getError('Por favor, informe o nome da mensagem ( name = "NomeDaMensagem" )'));
    }
});

app.get('/',function(req,res) {
    res.sendFile(path.join(__dirname+'/index.html'));
});

async function setup(){

    console.log('Example app is listening on port 3000.')

    const messages = await database.discord.get()
    messages.forEach((msg)=>{
        if(msg.title && msg.text && msg.dateTime && msg.webhook){
            agendarMsg(msg.dateTime,msg.text,msg.title,msg.webhook)
            console.log('msg agendada: '+msg.title)
        }
    })
}

app.listen(3000, () => setup());