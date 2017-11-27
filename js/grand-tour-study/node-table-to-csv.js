// ref: https://github.com/geoffreyburdett/node-table-to-csv/blob/master/index.js
// modified to add the href of an anchor into a table cell, preppended by '||'
// then go into excel or other app and split by that delimiter

const cheerio = require('cheerio');
const EOL = require('os').EOL;

module.exports = function (sTableParentHtml, options) {
    const $ = cheerio.load(sTableParentHtml);
    const $tables = (options && options.selector) ? $(options.selector) : $('table');

    if ($tables.length > 1) {
        return joinedTables($tables, options);
    } else {
        return createCsv(createMatrix($tables));
    }

    function createMatrix(_$table) {
        var matrix = [],
            i = 0;

        _$table.find('tr').each(function (index, el) {
            var j = 0,
                $row = $(el);

            matrix[i] = [];

            $row.find('th').each(function (index, el) {
                let $th = $(el);

                matrix[i][j] = $th.text().trim().replace(/(\r\n|\n|\r)/gm, '');
                j++;
                return matrix;
            });

            $row.find('td').each(function (index, el) {
                let $td = $(el),
                    $anchor = $td.find('a').first(), // supports only 1
                    sHref = $anchor[0] ? ('||' + $anchor.attr('href')) : '';

                matrix[i][j] = '"'
                                + $td.text().trim()
                                + sHref
                                + '"';
                j++;
                return matrix;
            });

            i++;
        });

        return matrix;
    }

    function createCsv(data) {
        let _sTableCsv = '';

        for (let i = 0; i < data.length; i++) {
            _sTableCsv += data[i].join(',') + EOL;
        }

        return _sTableCsv;
    }

    function joinedTables(_$tables, options) {
        let sJoinedOutput = '';

        $tables.each(function (i, el) {
            let $el = $(el);
            let _sTableCsv = createCsv(createMatrix($el));

            if (options.tableFunction) {
                _sTableCsv = options.tableFunction(_sTableCsv, $el, i); // useful for adding a table id for example
            }

            sJoinedOutput += _sTableCsv;
        });

        return sJoinedOutput;
    }
}
