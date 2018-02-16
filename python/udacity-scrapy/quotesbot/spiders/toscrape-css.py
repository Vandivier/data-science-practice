# -*- coding: utf-8 -*-
import json
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

        listoCandidates = response.css("a")
        for o in listoCandidates:
            bCondition = None
            _arrText = o.xpath('.//text()').extract()

            for sText in _arrText:
                sFalconCheck = sText.split(' ')[0].lower()
                print(sFalconCheck)
                bCondition = sFalconCheck == 'falcon'

                if bCondition:
                    sNextPageUrl = o.css("::attr(href)").extract_first()
                    yield scrapy.Request(response.urljoin(sNextPageUrl))
                    break

            if bCondition:
                break
