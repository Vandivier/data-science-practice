# Not-QuotesBot

Not-QuotesBot is, like, I took the QuotesBot repo and put it here.

Then I changed some stuff and made notes in this readme.

The rest of this readme is unchanged from [QuotesBot source](https://github.com/scrapy/quotesbot), except this intro, and the section called More Notes for Not-QuotesBot.

# QuotesBot

This is a Scrapy project to scrape quotes from famous people from http://quotes.toscrape.com ([github repo](https://github.com/scrapinghub/spidyquotes)).

This project is only meant for educational purposes.


## Extracted data

This project extracts quotes, combined with the respective author names and tags.
The extracted data looks like this sample:

    {
        'author': 'Douglas Adams',
        'text': '“I may not have gone where I intended to go, but I think I ...”',
        'tags': ['life', 'navigation']
    }


## Spiders

This project contains one spider and you can list it using the `list`
command:

    $ scrapy list
    toscrape-css

Both spiders extract the same data from the same website, but `toscrape-css`
employs CSS selectors, while `toscrape-xpath` employs XPath expressions.

You can learn more about the spiders by going through the
[Scrapy Tutorial](http://doc.scrapy.org/en/latest/intro/tutorial.html).


## Running the spiders

You can run a spider using the `scrapy crawl` command, such as:

    $ scrapy crawl toscrape-css

If you want to save the scraped data to a file, you can pass the `-o` option:
    
    $ scrapy crawl toscrape-css -o quotes.json

# More Notes for Not-QuotesBot

Notes:
1. Scrapy [shouldn't be installed on Windows via `pip`](https://doc.scrapy.org/en/latest/intro/install.html#intro-install-platform-notes). I chose `Miniconda`.

Links:
