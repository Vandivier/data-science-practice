# -*- coding: utf-8 -*-
import re
import scrapy

class ToScrapeCSSSpider(scrapy.Spider):
    name = "scrape"
    start_urls = [
        'https://en.wikipedia.org/wiki/Falcon_Heavy',
    ]

    def parse(self, response):
        for i, quote in enumerate(response.css("p")):
            arrText = quote.xpath('.//text()').extract()
            sPostProcessed = ''.join(arrText)
            sFirstWord = sPostProcessed.split(' ')[0]

            yield {
                'anchorCount': sum(1 for _i in quote.css("a").extract()),
                'index': i,
                'firstWord': sFirstWord,
                'text': sPostProcessed
            }

            '''
        next_page_url = response.css("li.next > a::attr(href)").extract_first()
        if next_page_url is not None:
            yield scrapy.Request(response.urljoin(next_page_url))
            '''
