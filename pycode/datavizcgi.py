__author__ = 'Kevin'

import db_access
import cgi, cgitb

'''
examples:
http://localhost:10808/dataviz/datavizcgi.py?method=query_by_corridor_group&target_plot=NZE&corridor_id=1&start_date=2013-10-01&end_date=2013-10-31
http://localhost:10808/dataviz/datavizcgi.py?method=query_by_acisa&target_plot=NZE&acisa=2135&start_date=2013-10-01&end_date=2013-10-31
http://localhost:10808/dataviz/datavizcgi.py?method=query_by_time_region&target_plot=BBL&start_date=2013-10-01&end_date=2013-10-31&dir=both
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
    target_plot = form.getvalue('target_plot')
    if output_format is None:
        print db_access.query_by_acisa(acisa, start_date, end_date, target_plot=target_plot)
    else:
        print db_access.query_by_acisa(acisa, start_date, end_date, output_format=output_format, target_plot=target_plot)

elif method == 'query_by_corridor_group':
    corridor_id = form.getvalue('corridor_id')
    start_date = form.getvalue('start_date')
    end_date = form.getvalue('end_date')
    output_format = form.getvalue('output_format')
    target_plot = form.getvalue('target_plot')
    if output_format is None:
        print db_access.query_by_corridor_group(corridor_id, start_date, end_date, target_plot=target_plot)
    else:
        print db_access.query_by_corridor_group(corridor_id, start_date, end_date, output_format=output_format, target_plot=target_plot)

elif method == 'query_by_time_region':
    start_date = form.getvalue('start_date')
    end_date = form.getvalue('end_date')
    dir = form.getvalue('dir')
    output_format = form.getvalue('output_format')
    target_plot = form.getvalue('target_plot')
    if dir is None:
        query_by_time_region(start_date, end_date, output_format='json', target_plot=target_plot)
    else:
        query_by_time_region(start_date, end_date, direction=dir, output_format='json', target_plot=target_plot)

elif method == 'getcorridor':
    print db_access.getcorridor()

else:
    print 'No request defined'