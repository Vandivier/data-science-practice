This readme will assist in replication.

Source information is currently in the xlsm. Run the macro in that xlsm to produce the csv files.

Import those into MySQL workbench. This repo contains a file with the SQL creations scripts, but you can also import yourself.

To import yourself, right click under Schemas on the workbench and create new schema. Right click on the new schema and use the data import wizard.

Or, just run the SQL script if you trust it. The script was create with MySQL data export.

By default, MySQL data export will only produce a script which contains schema and table creation, not the data inside.

Edit this file to allow inclusion of data in MySQL workbench data export:
C:\ProgramData\MySQL\MySQL Server 5.7\my.ini

After you run dice-salaries.sql you will need to go obtain the csv file and manually add the header text line.
