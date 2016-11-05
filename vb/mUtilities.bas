Attribute VB_Name = "mUtilities"
Option Explicit

'takes every nth row from a csv file and writes it into the first sheet of this xlsm
'assumes the filename is in the same folder as the xlsm
Public Sub NthRowToSheet(Optional ByVal sFileName As String = "ss15hny", Optional ByVal iNthRow As Integer = 1000)
    Dim iLines          As Double
    Dim sTextLine       As String
    Dim vTextLines      As Variant
    Dim iOutRow         As Integer

    sFileName = ActiveWorkbook.Path & "\" & sFileName & ".csv"
    iOutRow = 1

    sTextLine = CreateObject("Scripting.FileSystemObject").OpenTextFile(sFileName).ReadAll
    vTextLines = Split(sTextLine, vbLf)

    With Sheet1
        For iLines = 0 To UBound(vTextLines)
            .Cells(iOutRow, 1).Value = vTextLines(iLines)
            iLines = iLines + iNthRow
            iOutRow = iOutRow + 1
        Next
    End With
End Sub

'desc: save each sheet from the current file as a seperate csv in the same directory
'ref: http://stackoverflow.com/questions/59075/save-each-sheet-in-a-workbook-to-separate-csv-files
Public Sub SaveWorksheetsAsCsv(Optional ByVal SaveToDirectory As String)
    Dim WS As Excel.Worksheet

    If SaveToDirectory = "" Then SaveToDirectory = Application.ActiveWorkbook.Path

    For Each WS In ThisWorkbook.Worksheets
        WS.SaveAs SaveToDirectory & "\" & WS.Name, xlCSV
    Next
End Sub

''''''''''''''''''''''''''''''''''''''''''''''''''''
'   Public Sub IOCountByColumn()
'   Depends on Miscrosoft Scripting Runtime
'
'   Desc:
'       A generic routine to generate counts.
'       Given these:
'           An input sheet/tab name
'           A column name in that sheet, the text cell value of the first line in that column
'           An output sheet/tab name
'           Optionally, output column keys for the column name and the counts
'               - If not specified, the last columns available are used
'       Do this:
'           Name the output columns
'           One cell for each unique entry in the input column
'           Add the count
'
'       A few example calls:
'           IOCountByColumn "InputSheet", "country", "OutputSheet"
'           IOCountByColumn "InputSheet", "C", "OutputSheet", "F", False
'
'
'       Notes:
'           For input and output columns, 3 characters or less is taken as an excel column, not title line text
'           You can enter multiple columns using a csv string "a,b,c"
'           later you could have an array of input sheets and an array of csv strings for each sheet.
'           neh jk...just use MySQL Workbench: http://www.mysql.com/products/workbench/
''''''''''''''''''''''''''''''''''''''''''''''''''''
'todo: finish it, and make a generic mapper
'note: pre-generic call like IOCountByColumn "registries", "I", "counts"
Public Sub IOCountByColumn( _
        ByVal sInputSheet As String, _
        ByVal sInputColumn As String, _
        ByVal sOutputSheet As String, _
        Optional ByVal sOutputColumns As String, _
        Optional ByVal bByTitleLine As Boolean = True)

    On Error GoTo Catch
    Dim cCell       As Range
    Dim wsIn        As Worksheet
    Dim wsOut       As Worksheet
    Dim dCountry    As New Scripting.Dictionary
    Dim sInputEntry As String
    Dim i           As Integer
    Dim vKey        As Variant

    Set wsIn = Worksheets(sInputSheet)
    Set wsOut = Worksheets(sOutputSheet)

    For Each cCell In wsIn.UsedRange.Columns(sInputColumn).Cells
        sInputEntry = cCell.Value
        If dCountry.Exists(sInputEntry) Then
            dCountry(sInputEntry) = dCountry(sInputEntry) + 1
        Else
            dCountry.Add sInputEntry, 1
            dCountry.Add sInputEntry & "quarter", Sheet1.Cells(cCell.Row, 5).Value                      'todo: not in generic version
            dCountry.Add sInputEntry & "avgHigh", Sheet1.Cells(cCell.Row, 6).Value                      'todo: not in generic version
            dCountry.Add sInputEntry & "avgLow", Sheet1.Cells(cCell.Row, 7).Value                      'todo: not in generic version
            dCountry.Add sInputEntry & "rain", Sheet1.Cells(cCell.Row, 8).Value                      'todo: not in generic version
        End If
    Next cCell

    i = 1
    For Each vKey In dCountry.Keys
        If vKey = "statequarter" Or Len(vKey) = 3 Then                      'todo: not in generic version
            wsOut.Cells(i, 1) = vKey
            wsOut.Cells(i, 2) = dCountry(vKey)
            wsOut.Cells(i, 3) = dCountry(vKey & "avgHigh")                      'todo: not in generic version
            wsOut.Cells(i, 4) = dCountry(vKey & "avgLow")                      'todo: not in generic version
            wsOut.Cells(i, 5) = dCountry(vKey & "rain")                      'todo: not in generic version
            wsOut.Cells(i, 6) = dCountry(vKey & "quarter")                      'todo: not in generic version
            i = i + 1
        End If
    Next vKey

    wsOut.Cells(1, 2) = "count"                                 'column title
    wsOut.Cells(1, 3) = "avgHigh"                                 'todo: not in generic version
    wsOut.Cells(1, 4) = "avgLow"                                 'todo: not in generic version
    wsOut.Cells(1, 5) = "rain"                                 'todo: not in generic version
    wsOut.Cells(1, 6) = "quarter"                                 'todo: not in generic version
CleanExit:
    Exit Sub
Catch:
    'err handler goes here
    Resume CleanExit
    Resume
End Sub
