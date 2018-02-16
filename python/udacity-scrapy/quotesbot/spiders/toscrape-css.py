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

        #arroCandidates = response.css("a::attr(href)").extract()
        listoCandidates = response.css("a")
        for o in listoCandidates:
            _arrText = o.xpath('.//text()').extract()

            for sText in _arrText:
                bCondition = sText.split(' ')[0].lower() == 'falcon'
                sNextPageUrl = o.css("::attr(href)") if bCondition else None
                if bCondition:
                    print(sNextPageUrl)
                    break

        print('context check ' + sNextPageUrl)
        if sNextPageUrl is not None:
            yield scrapy.Request(response.urljoin(sNextPageUrl))
