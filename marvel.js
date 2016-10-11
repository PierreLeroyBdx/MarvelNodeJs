const api = require('marvel-api');
var marvel
const inquirer = require('inquirer')
const db = require('sqlite')
const fs = require('fs')
const program = require('commander')
var publicKeyAsk = "81da4b23404e2ba087d5c9f37d2c396c"
var privateKeyAsk = ""

program
    .version('1.0.0')
    .option('-h, --heros [name]', 'quel héros cherches tu ?')
program.parse(process.argv)

FirstConnection()

function FirstConnection() {
    db.open('marvel.db').then(() => {
        db.run('CREATE TABLE IF NOT EXISTS MarvelKeyBDD (private)')
    }).then(() =>{
        readPrivateKey()
    }).catch((err) => { // Si on a eu des erreurs
        console.error('ERR> ', err)
    })
}



//on compte le nombre d'éléments, si il n'y en a pas alors on demande la clé privé pour l'insérer
//Ce programme ne vérifie pas si la clé privé inséré lors de la première execution est bonne, il part du principque qu'elle l'est.
//ce programme ne permet pas de faire un update en bdd
function readPrivateKey() {
    db.all('SELECT * FROM MarvelKeyBDD').then((tableM) => {
        if (tableM.length == 0) {
            insertIntoBDD() //si aucun élément alors on insert
        }else {
            privateKeyAsk = tableM[0]["private"];
            marvelVariable()
        }
    }).catch((err) => {
        console.error('ERR> ', err)
    })
}
function insertIntoBDD(){
    var privateKeyAsk = ""
    inquirer.prompt([
        {
            type: 'input',
            message: 'clé privé : ',
            name: 'privateKeyAsk'
        }]).then((answers) => {
        privateKeyAsk = answers["privateKeyAsk"]
        db.run('INSERT INTO MarvelKeyBDD VALUES (?)', privateKeyAsk)
    })
}

function marvelVariable(){ //programme principal qui va créer la variable marvel indispensable pour se connecter à l'API puis affiche un menu
    marvel = api.createClient({
        publicKey: publicKeyAsk,
        privateKey: privateKeyAsk
    });
    //ce programme ne vérifie pas si le héros existe en bdd de l'API
    inquirer.prompt([
            {
            type: 'list',
            message: 'Quelle action voulez-vous executer ? ',
            name: 'choice',
            choices: [
                'afficher les comics du heros',
                'afficher les event d un heros',
                'afficher le resume d un heros'
                   ]
        }
        ]).then((answers) => {
        if(answers.choice == "afficher les comics du heros"){
            displayComic(`${program.heros}` )
        }else if( answers.choice ==  "afficher les event d un heros"){
            displayEvent(`${program.heros}` )
        }else if(answers.choice == "afficher le resume d un heros"){
            displayResume(`${program.heros}` )
        }
    })



}
function displayComic(answers){
    console.log(answers)
    marvel.characters.findByName(answers)
        .then(function(res) {
            console.log('Found character ID', res.data[0].id);
            return marvel.characters.comics(res.data[0].id);
        })
        .then(function(res) {
            console.log('found %s comics of %s total', res.meta.count, res.meta.total);

            for (let i = 0, l = res.data.length; i < l; i++) {
                console.log(res.data[i]["title"]);
            }
        })
        .fail(console.error)
        .done();
}
function displayResume(answers){
    var body
    marvel.characters.findByName(answers).then(function(res) {
        console.log('Found character ID', res.data[0].id);
        return marvel.characters.stories(res.data[0].id);
    })
        .then(function(res) {
            for (let i = 0, l = res.data.length; i < l; i++) {
               if(res.data[i]["title"] != ''){
                body +=res.data[i]["title"]
               }
            }
                inquirer.prompt([
                {
                    type: 'input',
                    message: 'voulez vous sauvegarder le resumé ? ',
                    name: 'answer'
                }]).then( (answer) =>{
                    if(answer["answer"] == "oui") {
                        inquirer.prompt([
                            {
                                type: 'input',
                                message: 'comment voulez vous nommez votre fichier : ',
                                name: 'nameFile'
                            }]).then((answers) => {
                            try {
                                fs.writeFile(answers["nameFile"], body, (err) => {
                                    if (err) throw err
                                    console.log('Fichier écrit')
                                })
                            } catch (err) {
                                console.error('ERR > ', err)
                            }
                        })
                    }
            })
        })
        .fail(console.error)
        .done();
}

function displayEvent(answers){
    marvel.characters.findByName(answers).then(function(res){
        marvel.characters.events(res.data[0].id)
            .then(console.log)
            .fail(console.error)
            .done();
    })
}
