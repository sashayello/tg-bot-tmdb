require('dotenv').config()

const { Telegraf } = require('telegraf')
const Markup = require('telegraf/markup')
const tmdb = require('./api/Tmdb')
const movieTrailer = require('./api/MovieTrailer')
 
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) =>  {
    ctx.reply(`👋 Привет, ${ctx.message.from.first_name}!\n\n🤖 Нажимай на кнопку и я помогу тебе сгенерировать рандомный фильм/сериал/тв программу!\n\n💬  /help - команда поможет тебе разобраться как работать с ботом`, Markup.keyboard([['Поиск фильма'], ['Поиск сериала/программы'], ['Помощь']]).resize().extra())
    console.log(`User id: ${ctx.message.from.id}\n\n User name: ${ctx.message.from.username}`)
})

bot.help((ctx) => {
    const message = `🤖 Я умный бот который поможет тебе подобрать фильм, сериал или программу на вечер.\n\n📖 Нажимай на определенную кнопку "Поиск фильма" или "Поиск сериала/программы", также можно в ручную написать команду поиска и я смогу подобрать фильм/сериал/программу.\n\n💬 "Поиск фильма" - команда поиска фильма\n\n💬 "Поиск сериала/программы" - команда поиска ТВ шоу\n\n💬 "Поиск сериала" - команда поиска ТВ шоу(равнозначна команде "Поиск сериала/программы")`
    ctx.reply(message)
})

bot.on('text', async (ctx) => {
    const { text } = ctx.message
    const textCapitalize = text.charAt(0).toUpperCase() + text.slice(1)

    const monthes = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря']

    const pageId = Math.floor(Math.random() * (500 - 1 + 1)) + 1
    const movieId = Math.floor(Math.random() * (20 - 1 + 1)) + 1

    let data = {}
    let trailer = ''

    if(textCapitalize === 'Поиск фильма') {


        try {
            const id = await tmdb.getMovieId(process.env.TMDB_API, pageId, movieId)
            const movie = await tmdb.getDescription(process.env.TMDB_API, id)

            const { title, release_date, overview, original_title, genres, poster_path } = movie

            const newGenres = genres.map(genre => {
                return genre.name
            }).join(', ')

            const poster = `http://image.tmdb.org/t/p/w600_and_h900_bestv2${poster_path}`

            const releaseDate = release_date.split("-")
            const day = releaseDate[2]
            const month = monthes[parseInt(releaseDate[1] - 1)]
            const year = releaseDate[0]

            try {

                trailer = await movieTrailer.getTrailer(original_title)

            } catch(e) {
                trailer = 'Трейлер к фильму не найден!'
                console.log(e);
            }

            data = {
                title,
                original_title: original_title ? original_title : 'Оригинальное название не найдено',
                overview: overview ? overview : 'Описание фильма не найдено',
                newGenres: newGenres ? newGenres : 'Жарны к фильму не определены',
                release: `${day} ${month} ${year}`,
                trailer
            }

            if(trailer === 'Трейлер к фильму не найден!') {
                ctx.replyWithPhoto(poster)
            }

            const random = `🎬 Название: ${data.title}\n\n💡 Описание фильма: ${data.overview}\n\n🎞 Оригинальное название: ${data.original_title}\n\n✅ Жанр: ${data.newGenres}\n\n🗓 Дата релиза: ${data.release}\n\n📺 Трейлер: ${data.trailer}`

            ctx.reply(random)

        } catch(e) {
            ctx.reply("Мы не смогли подобрать фильм! Попробуйте еще раз!")
            console.log(e);
        }


    }
    if(textCapitalize === 'Поиск сериала/программы' || textCapitalize === 'Поиск сериала') {

        try {

            const id = await tmdb.getTvId(process.env.TMDB_API, pageId, movieId)
            const tvShow = await tmdb.getTvDescription(process.env.TMDB_API, id)

            const { name, overview, poster_path, genres, original_name, first_air_date, last_air_date } = tvShow

            const tvGenres = genres.map(genre => {
                return genre.name
            }).join(', ')

            const poster = `http://image.tmdb.org/t/p/w600_and_h900_bestv2${poster_path}`

            const firstAirDate = first_air_date.split('-')
            const airYear = firstAirDate[0]
            const airMonth = monthes[parseInt(firstAirDate[1] - 1)]
            const airDay = firstAirDate[2]

            const lastAirDate = last_air_date.split('-')
            const lastYear = lastAirDate[0]
            const lastMonth = monthes[parseInt(lastAirDate[1] - 1)]
            const lastDay = lastAirDate[2]


            try {
                trailer = await movieTrailer.getTrailer(original_name)
            } catch(e) {
                trailer = 'Трейлер к сериалу/программе не найден!'
                console.log(e);
            }

            data = {
                name,
                original_name: original_name ? original_name : 'Оригинальное название сериала/программы не найдено',
                overview: overview ? overview : 'Описание сериала/программы не найдено',
                tvGenres: tvGenres ? tvGenres : "Жарны к сериалу/программе не определены",
                airDate: first_air_date !== '' ? `${airDay} ${airMonth} ${airYear}` : 'Дата начала сериала/программы не найдено!',
                lastDate: last_air_date !== '' ? `${lastDay} ${lastMonth} ${lastYear}` : 'Дата окончания сериала/программы не найдно! Возможно проект еще работает!',
                trailer
            }

            if(trailer === 'Трейлер к сериалу/программе не найден!') {
                ctx.replyWithPhoto(poster)
            }

            const random = `🎬 Название: ${data.name}\n\n💡 Описание фильма: ${data.overview}\n\n🎞 Оригинальное название: ${data.original_name}\n\n✅ Жанр: ${data.tvGenres}\n\n🗓 Дата релиза: ${data.airDate}\n\n🗓 Дата окончания: ${data.lastDate}\n\n📺 Трейлер: ${data.trailer}`

            ctx.reply(random)


        } catch(e) {
            ctx.reply('Мы не смогли подобрать сериал! Попробуйте еще раз!')
            console.log(e);
        }

    }
    if(textCapitalize === 'Помощь') {
        const message = `🤖 Я умный бот который поможет тебе подобрать фильм, сериал или программу на вечер.\n\n📖 Нажимай на определенную кнопку "Поиск фильма" или "Поиск сериала/программы", также можно в ручную написать команду поиска и я смогу подобрать фильм/сериал/программу.\n\n💬 "Поиск фильма" - команда поиска фильма\n\n💬 "Поиск сериала/программы" - команда поиска ТВ шоу\n\n💬 "Поиск сериала" - команда поиска ТВ шоу(равнозначна команде "Поиск сериала/программы")\n\n💬 /help - помощь работы с Ботом`
        ctx.reply(message)
    }


})

bot.launch()

console.log('Bot started!');