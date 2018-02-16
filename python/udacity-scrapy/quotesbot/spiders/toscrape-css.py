# -*- coding: utf-8 -*-
import re
import scrapy

class ToScrapeCSSSpider(scrapy.Spider):
    name = "scrape"
    start_urls = [
        'https://en.wikipedia.org/wiki/Falcon_Heavy',
    ]

    def parse(self, response):
        regex = re.compile(r" +", flags=re.MULTILINE)

        for i, quote in enumerate(response.css("p")):
            arrText = quote.xpath('.//text()').extract()
            sAllText = ' '.join(arrText)
            sPostProcessed = regex.sub(" ", sAllText)
            #re.sub( '\s+', ' ', mystring ).strip()

            yield {
                'anchorCount': '',
                'index': i,
                'firstWord': '',
                'text': sPostProcessed
            }

            '''
        next_page_url = response.css("li.next > a::attr(href)").extract_first()
        if next_page_url is not None:
            yield scrapy.Request(response.urljoin(next_page_url))
            '''
