require('dotenv').config()

const { Telegraf } = require('telegraf')
const Markup = require('telegraf/markup')
const tmdb = require('./api/Tmdb')
const movieTrailer = require('./api/MovieTrailer')
 
const bot = new Telegraf(process.env.BOT_TOKEN)

bot.start((ctx) =>  {
    ctx.reply(`Привет, ${ctx.message.from.first_name}!\n\nНажимай на кнопку и я помогу тебе сгенерировать рандомный фильм!`, Markup.keyboard([['Поиск фильма']]).resize().extra())
})

// bot.help((ctx) => ctx.reply('Send me a sticker'))

bot.on('text', async (ctx) => {
    const { text } = ctx.message
    const textCapitalize = text.charAt(0).toUpperCase() + text.slice(1)

    const monthes = ['Января', 'Февраля', 'Марта', 'Апреля', 'Мая', 'Июня', 'Июля', 'Августа', 'Сентября', 'Октября', 'Ноября', 'Декабря']

    if(textCapitalize === 'Поиск фильма') {
        const pageId = Math.floor(Math.random() * (500 - 1 + 1)) + 1
        const movieId = Math.floor(Math.random() * (20 - 1 + 1)) + 1

        let data = {}
        let trailer = ''

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
                newGenres,
                release: `${day} ${month} ${year}`,
                trailer
            }

            if(trailer === 'Трейлер к фильму не найден!') {
                ctx.replyWithPhoto(poster)
            }

            const random = `🎬 Название: ${data.title}\n\n💡 Описание фильма: ${data.overview}\n\n🎞 Оригинальное название: ${data.original_title}\n\n✅ Жанр: ${data.newGenres}\n\n🗓 Дата релиза: ${data.release}\n\n📺 Трейлер: ${data.trailer}`

            ctx.reply(random)

        } catch(e) {
            ctx.reply("Мы не смогли подобрать фильм!")
            console.log(e);
        }


    }


})

bot.launch()

console.log('Bot started!');