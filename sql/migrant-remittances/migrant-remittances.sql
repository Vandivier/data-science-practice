CREATE SCHEMA `migrant_remittances`;

/*
Import oecd.csv and outflows.csv
transform outflows.csv to migrant_remittances_in.csv
*/

ALTER TABLE `migrant_remittances`.`migrant_remittances_in` 
ADD COLUMN `is_oecd` INT(1) NULL AFTER `after`;

UPDATE migrant_remittances.migrant_remittances_in AS indata
SET is_oecd = 0;

UPDATE migrant_remittances.migrant_remittances_in AS indata
SET is_oecd = 1
WHERE EXISTS (
  SELECT * FROM migrant_remittances.oecd AS oecd
  WHERE indata.country = oecd.Country
  );

SELECT *
INTO OUTFILE 'C:/ProgramData/MySQL/MySQL Server 5.7/Uploads/migrant-remittances.csv'
  FIELDS TERMINATED BY ','
  OPTIONALLY ENCLOSED BY '"'
  LINES TERMINATED BY '\n'
FROM migrant_remittances.migrant_remittances_in;

/* add title line to csv by hand */
