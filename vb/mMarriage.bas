Attribute VB_Name = "mMarriage"
Option Explicit

'data source: http://www.usclimatedata.com/climate/united-states/us
Public Sub MapTempAndRainToRegistries()
    Dim oRow            As Range
    Dim oForeignRange   As Range
    Dim sState          As String
    Dim sQuarter        As String
    'Dim i               As Long                                                 'just to make sure i hit all rows
    Dim wsSheet         As Worksheet

    For Each oRow In Sheet1.Rows
        'i = i + 1
        'Debug.Print i

        sState = Sheet1.Cells(oRow.Row, 3)
        If sState <> "state" Then                                               'skip title row
            If sState = "" Then Exit For                                        'just loop thru populated rows

            sQuarter = Sheet1.Cells(oRow.Row, 5)
            Set wsSheet = Worksheets("q" & sQuarter)
            Set oForeignRange = GetForeignRange(sState, sQuarter, wsSheet)

            If Not oForeignRange Is Nothing Then
                With oForeignRange
                    Sheet1.Cells(oRow.Row, 6).Value = wsSheet.Cells(.Row, 2)    'avgHigh
                    Sheet1.Cells(oRow.Row, 7).Value = wsSheet.Cells(.Row, 3)    'avgLow
                    Sheet1.Cells(oRow.Row, 8).Value = wsSheet.Cells(.Row, 4)    'precipitation

                    'Debug.Print Sheet1.Cells(oRow.Row, 1).Value
                End With
            End If

        End If

    Next oRow
End Sub

'desc: the row from the other sheet with the values of interest by state
'sheets are quarterly averages; eg, seasonal averages by state
Private Function GetForeignRange(ByVal sState As String, ByVal sQuarter As String, ByRef wsSheet As Worksheet) As Range
    On Error GoTo Catch
    Dim oRow As Range

    For Each oRow In wsSheet.Rows
        If wsSheet.Cells(oRow.Row, 1).Value = sState Then
            Set GetForeignRange = oRow
            Exit Function
        End If
    Next oRow

Catch:
End Function
