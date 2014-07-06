__author__ = 'Kevin'

import db_access
import cgi, cgitb

'''
examples:
http://localhost:10808/dataviz/datavizcgi.py?method=query_by_corridor_group&corridor_id=1&start_date=2013-10-01&end_date=2013-10-31
http://localhost:10808/dataviz/datavizcgi.py?method=query_by_acisa&acisa=2135&start_date=2013-10-01&end_date=2013-10-31
http://localhost:10808/dataviz/datavizcgi.py?method=getcorridor

'''

print "Status: 200 OK"
print "Content-Type: text/plain;charset=utf-8"
print

# Create instance of FieldStorage
form = cgi.FieldStorage()

# Get data from fields
method = form.getvalue('method')

if method == 'query_by_acisa':
    acisa = form.getvalue('acisa')
    start_date = form.getvalue('start_date')
    end_date = form.getvalue('end_date')
    output_format = form.getvalue('output_format')
    if output_format is None:
        print db_access.query_by_acisa(acisa, start_date, end_date)
    else:
        print db_access.query_by_acisa(acisa, start_date, end_date, output_format)

elif method == 'query_by_corridor_group':
    corridor_id = form.getvalue('corridor_id')
    start_date = form.getvalue('start_date')
    end_date = form.getvalue('end_date')
    output_format = form.getvalue('output_format')
    if output_format is None:
        print db_access.query_by_corridor_group(corridor_id, start_date, end_date)
    else:
        print db_access.query_by_corridor_group(corridor_id, start_date, end_date, output_format)

elif method == 'getcorridor':
    print db_access.getcorridor()

else:
    print 'No request defined'