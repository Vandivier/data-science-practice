Attribute VB_Name = "mCountsByCountry"
Option Explicit

'desc: produce a collection of key value pairs.
'Key is unique country name, value is count of rows.
'Write the collection to a new worksheet
Public Sub GenerateCountsByCountry()
    On Error GoTo Catch
    Dim cCell       As Range                                    'range = cell
    Dim wsIn        As Worksheet
    Dim wsOut       As Worksheet
    Dim dCountry    As New Scripting.Dictionary
    Dim sCountry    As String
    Dim i           As Integer
    Dim vKey        As Variant

    Set wsIn = Worksheets(1)
    Set wsOut = Worksheets(2)

    For Each cCell In wsIn.UsedRange.Columns("I").Cells
        sCountry = cCell.Value
        If dCountry.Exists(sCountry) Then
            dCountry(sCountry) = dCountry(sCountry) + 1
        Else
            dCountry.Add sCountry, 1
        End If
    Next cCell

    i = 1
    For Each vKey In dCountry.Keys
        wsOut.Cells(i, 1) = vKey
        wsOut.Cells(i, 2) = dCountry(vKey)
        i = i + 1
    Next vKey

    wsOut.Cells(1, 2) = "count"                                 'column title
CleanExit:
    Exit Sub
Catch:
    'err handler goes here
    Resume CleanExit
    Resume
End Sub


