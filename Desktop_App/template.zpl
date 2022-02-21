^XA

^FX Top section with logo, name and address.
^CF0,60
^FO50,50^GB100,100,100^FS
^FO75,75^FR^GB100,100,100^FS
^FO93,93^GB40,40,40^FS
^FO220,50^FDSmart Solutions.^FS
^CF0,30
^FO220,115^FDOrder No. ORDERNUMBER^FS
^FO220,155^FDCourse No. CourseNumber^FS
^FO220,195^FDDestination: Ruse^FS
^FO50,250^GB700,3,3^FS

^FX Second section with recipient address and permit information.
^CFA,30
^FO150,300^FDCourseId:  {barcodeDict["CourseId"]}^FS
^FO150,340^FDOrderId: {barcodeDict["OrderId"]}^FS
^FO150,380^FDItemModel: {barcodeDict["ItemModel"]}^FS
^FO150,420^FDHeight: {barcodeDict["Height"]}^FS
^FO150,460^FDWidth: {barcodeDict["Width"]}^FS
^FO150,500^FDDecor: {barcodeDict["Decor"]}^FS
^CFA,15
^FO50,550^GB700,3,3^FS

^FX Third section with bar code.
^BY5,2,270
^FO100,600^BC^FD{barcode}^FS
^XZ