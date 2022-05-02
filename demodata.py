import mysql.connector
import random
from datetime import datetime
import math

mydb = mysql.connector.connect(
    host="localhost",
    user="18049903D",
    password="12345",
    database="student"
)

IDtemplate = 18049900
dt = datetime.now()
ts = int(datetime.timestamp(dt))
ts = math.floor(ts/(60 * 5)) * (60 * 5)
timestamp = ts
courseList = ["COMP1001","COMP1002","COMP1003","COMP1004"]
fileNameList = ["/Assignment1/test1.html","/Assignment1/test2.py","/Assignment1/test3.java","/Assignment1/test4.js"]

mycursor = mydb.cursor()
for k in range(288): #one day  
    timestamp = timestamp - (60 * 5)
    date = datetime.fromtimestamp(timestamp)
    print(date)
    for i in range(100):
        studentID = IDtemplate + i
        recordNum = random.randint(3, 5)
        for j in range(recordNum):
            fullID = str(studentID) + "D"
            
            index = random.randint(0, 3)
            file = fileNameList[index]
            course = courseList[index]
            sql = "INSERT INTO EditorRecord (studentID, courseID, activeTime, fileName, codedTime, fileLine) VALUES (%s, %s, %s, %s, %s, %s);"
            val = (fullID, course, date, file, random.randint(30, 60),random.randint(5, 30))
            mycursor.execute(sql, val)

mydb.commit()

print(mycursor.rowcount, "record inserted.")