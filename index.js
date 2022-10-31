const express = require('express');
const nodeSchedule = require('node-schedule');

const app = express();
const path = require('path');

const axios = require('axios')

app.use(express.json());

const URL='https://discord.com/api/webhooks/1036497521305997404/1ptSY42aDD5JPuP3QgWyGLetZ2ul5jcBYa6m4WcpnWBeHZVVQ0lVcPsd4n3Ne3P0dl7p'

const sendDiscordMsg=async (text)=>{
    await axios.post(URL, JSON.stringify({
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

const agendarMsg = (dateTime,text,title)=>{
    const job = nodeSchedule.scheduleJob(title,dateTime, () => {
        sendDiscordMsg(text)
        console.log('message : '+text)
    });

    nodeSchedule.scheduledJobs[title].text=text

    return('mensagem agendada! - '+job.nextInvocation())
}

app.post('/messages/add', (req, res) => {

    console.log(req.body)

    if(!req.body || !req.body.title || !req.body.text || !req.body.date || !req.body.time ){
        return res.send('Erro, envie (title,text,date,time) para agendar a mensagem')
    }

    try{
        const dateTime=generateDate(req.body.date,req.body.time)
        console.log(dateTime)
        return res.send(agendarMsg(dateTime,req.body.text,req.body.title))
    }catch(err){
        res.statusCode = 400;
        return res.send(err.message)
    }
})

app.get('/messages', (req, res) => {
    let jobs = nodeSchedule.scheduledJobs

    console.log(jobs)

    var messages = []
    
    Object.values(jobs).forEach(job => {
        messages.push({
            name:job.name,
            date:job.nextInvocation(),
            text:job.text,
        })
    });

    res.send(messages);
});

app.post('/messages/del', (req, res) => {

    if(req.body.name){

        try{
            var job = nodeSchedule.scheduledJobs[req.body.name];
            job.cancel();

            res.send('Mensagem ( '+req.body.name+' ) cancelada');
        }catch(e){
            res.statusCode = 400;
            console.log(e.message)
            res.send('O nome da mensagem é invalido!');           
        }

    }else{
        res.statusCode = 400;
        res.send('Por favor, informe o nome da mensagem ( name = "NomeDaMensagem" )');
    }
});

app.get('/',function(req,res) {
    res.sendFile(path.join(__dirname+'/index.html'));
});


app.listen(3000, () => console.log('Example app is listening on port 3000.'));