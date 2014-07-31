"""
Date: Fri Jun 13 22:12:05 2014
@author: Kevin Lu
@email: kevinlu@vt.edu

Description: Database method assembly for traffic visualization
"""

import pyodbc
import xml.etree.cElementTree as ET
import datetime
import os
import json

# Hard coding area
CorridorFile = 'corridors.txt'
db_setting_path = 'dbsettings.json'
folder = os.path.dirname(os.path.abspath(__file__))
CorridorFile = os.path.join(folder, CorridorFile)
db_setting_path = os.path.join(folder, db_setting_path)
# -----------------

def load_dbsetting_file(fpath):
    """
    return db settings DBServer, DBname, UID, PWD, TABLENAME
    :param fpath: dbsetting file path
    """
    f = open(fpath, 'r')
    dct = json.load(f)
    f.close()
    return dct["DBServer"], dct["DBName"], dct["UID"], dct["PWD"], dct["TABLENAME"]


def load_corridors():
    """
    load the CorridorFile and returns the dict structure
    {corridorID: {'name':name, 'acisa_range':acisa_range, 'intersections': the list of acisa # corresponding to the corridor}}
    """
    cor_data = {}
    f = open(CorridorFile, 'r')
    lines = f.readlines()
    for i, line in enumerate(lines):
        l = line.split(':')
        cid = l[0].strip()
        name = l[1].strip()
        acisa_range = l[2].strip()
        intersections = [t.strip() for t in l[3].split(',')]
        cor_data[cid] = {'name': name, 'acisa_range': acisa_range, 'intersections': intersections}
    f.close()
    return cor_data


def query_by_corridor_group(corridor_id, start_date, end_date, output_format = 'csv', target_plot = 'NZE'):
    """
    
    returns the aggregated value

    :param corridor_id:
        1:NY AVE
        2:CT AVE
        3:14TH ST
        4:Constitution AVE
        5:Reservoir - MacArthur
        6:H st - Bening Rd        

    :param start_date, end_date:
        YYYY-MM-DD        

    :param output_format:
        'csv', 'xml'
    :param target_plot:
        'NZE': for generating "New Zealand Earthquakes" plot
                http://bl.ocks.org/d3noob/4425979

        'TVV': for generating "Time vs. Volume" plot

    """
    # get corridor ACISA list
    cor_data = load_corridors()
    corr_acisas = ','.join('\'' + t + '\'' for t in cor_data[str(corridor_id)]['intersections'])

    StartDatetime = datetime.datetime.strptime(start_date, '%Y-%m-%d')
    EndDatetime = datetime.datetime.strptime(end_date, '%Y-%m-%d')

    # query data
    DBserver, DBname, UID, PWD, tblname = load_dbsetting_file(db_setting_path)
    connStr = (r'DRIVER={SQL Server};SERVER=' +
               DBserver + ';DATABASE=' + DBname + ';' +
               'UID=' + UID + ';PWD=' + PWD)

    conn = pyodbc.connect(connStr)

    #    query = "SELECT data_datetime, ACISA, laneDir, VolSum, avg_speed FROM %s WHERE ACISA IN (%s) " % (tblname, corr_acisas) \
    #            + "AND data_datetime between \'%s\' and \'%s\' ORDER BY ACISA, data_datetime ASC" % (start_date, end_date)

    query = "SELECT data_datetime, laneDir, sum(VolSum), avg(avg_speed) FROM %s WHERE ACISA IN (%s) " % (
        tblname, corr_acisas) \
            + "AND data_datetime between \'%s\' and \'%s\' GROUP BY laneDir, data_datetime ORDER BY laneDir, data_datetime ASC" % (
        start_date, end_date)

    query_single = "SELECT data_datetime, CONVERT(varchar, ACISA)+laneDir as ACLane, SUM(VolSum) as SumV, AVG(avg_speed) as AvgSp FROM %s WHERE ACISA IN (%s) " % (
        tblname, corr_acisas) \
                   + "AND data_datetime between \'%s\' AND \'%s\' group by data_datetime, ACISA, laneDir order by ACLane, data_datetime" % (
        start_date, end_date)

    dbCursor = conn.cursor()

    dbCursor.execute(query)

    info = {}

    for row in dbCursor:
    #        (dt, acisa, lanedr, vol, avgspd) = tuple(row[0:6])
    #        print  dt, acisa, lanedr, vol, avgspd
        (dt, lanedr, vol, avgspd) = tuple(row[0:4])
        if not info.has_key(lanedr):
            info[lanedr] = []
        info[lanedr].append({'datetime': dt, 'speed': avgspd, 'vol': vol})
    #        print  dt, lanedr, vol, avgspd

    # dbCursor.execute(query_single)

    # singleInfo = {}

    # for row in dbCursor:
    #     (dt, aclane, vol, speed) = tuple(row[0:4])
    #     if not singleInfo.has_key(aclane):
    #         singleInfo[aclane] = {}
    #     if dt.strftime('%d') == StartDatetime.strftime('%d'):
    #         singleInfo[aclane].update({dt.strftime('%H'): str(vol)})
    #     else:
    #         singleInfo[aclane].update({'24': str(vol)})

    outtext1 = generate_outtext(info, output_format, target_plot)
    # outtext2 = generate_outtext(singleInfo, output_format, target_plot, Ctable = True)

    outtext = outtext1
    # outtext = outtext1 + '||' + outtext2
    return outtext


def query_by_acisa(acisa, start_date, end_date, output_format = 'csv', target_plot = 'NZE'):
    """
    for generating "New Zealand Earthquakes" plot
    http://bl.ocks.org/d3noob/4425979

    returns the aggregated value

    :param acisa:
        the acisa # of the intersection

    :param start_date, end_date:
        YYYY-MM-DD

    :param output_format:
        'csv', 'xml'
    """
    # query data
    DBserver, DBname, UID, PWD, tblname = load_dbsetting_file(db_setting_path)
    connStr = ( r'DRIVER={SQL Server};SERVER=' +
                DBserver + ';DATABASE=' + DBname + ';' +
                'UID=' + UID + ';PWD=' + PWD)

    conn = pyodbc.connect(connStr)

    #    query = "SELECT data_datetime, ACISA, laneDir, VolSum, avg_speed FROM %s WHERE ACISA IN (%s) " % (tblname, corr_acisas) \
    #            + "AND data_datetime between \'%s\' and \'%s\' ORDER BY ACISA, data_datetime ASC" % (start_date, end_date)

    query = "SELECT data_datetime, laneDir, sum(VolSum), avg(avg_speed) FROM %s WHERE ACISA IN (%s) " % (tblname, acisa) \
            + "AND data_datetime between \'%s\' and \'%s\' GROUP BY laneDir, data_datetime ORDER BY laneDir, data_datetime ASC" % (
        start_date, end_date)
    #    print query

    dbCursor = conn.cursor()
    dbCursor.execute(query)

    info = {}

    for row in dbCursor:
    #        (dt, acisa, lanedr, vol, avgspd) = tuple(row[0:6])
    #        print  dt, acisa, lanedr, vol, avgspd
        (dt, lanedr, vol, avgspd) = tuple(row[0:4])
        if not info.has_key(lanedr):
            info[lanedr] = []
        info[lanedr].append({'datetime': dt, 'speed': avgspd, 'vol': vol})
    #        print  dt, lanedr, vol, avgspd

    outtext = generate_outtext(info, output_format, target_plot)
    return outtext


def generate_outtext(info, output_format, target_plot, Ctable = False):
    """
    input the database query and generate the formatted text

    :param info:
        generated from database query.
    :param output_format:
        'xml', 'csv'
    :param target_plot:
        'NZE'-- NZE plot ("week_year,day_time,speed,vol,lanedr")
        'TVV'-- Time VS Volume plot ("date_time, volume, lanedir")
    :return:
    """
    if Ctable == True:
        # heading = ['ACISA,' + ','.join([str(i) for i in range(25)])]
        heading = []
        for oneAC in info:
            Volcontent = ['-1' for x in range(25)]
            for i in info[oneAC]:
                Volcontent[int(i)] = info[oneAC][i]
            heading.append(oneAC + ',' + ','.join(Volcontent))
        return '\n'.join(heading)


    if target_plot == 'NZE':  # format for generating NZE plot ("week_year,day_time,speed,vol,lanedr")
        if output_format == 'xml':
            # construct XML
            root = ET.Element("items")
            for k, v in info.items():
                lanedr = ET.SubElement(root, "lanedr")
                lanedr.set('direction', k.strip())
                for v0 in v:
                    item = ET.SubElement(lanedr, "item")
                    item.set("datetime", v0['datetime'].strftime("%Y-%m-%d %H:%M:%S"))
                    item.set("speed", str(v0['speed']))
                    item.set("vol", str(v0['vol']))

            tree = ET.ElementTree(root)
            #    tree.write("test.xml") # write to a temporary file
            return ET.dump(tree) # return an XML string

        elif output_format == 'csv':
            # construct csv
            text = ["week_year,day_time,speed,vol,lanedr"]
            for k, v in info.items():
                kk = k.strip()
                for v0 in v:
                    wday = datetime.datetime(1900, 1, 7, v0['datetime'].hour, v0['datetime'].minute,
                                             v0['datetime'].second) + datetime.timedelta(
                        (v0['datetime'].weekday() + 1) % 7, 0)
                    text.append("%s,%s,%s,%s,%s" % (
                        v0['datetime'].strftime("%Y-%m-%d"), wday.strftime("%Y-%m-%d %H:%M:%S"), str(v0['speed']),
                        str(v0['vol']), kk))
            outtext = '\n'.join(t for t in text)
            return outtext

    elif target_plot == 'TVV': # format for generating Time VS Volume plot ("date_time, volume, lanedir")
        if Ctable is True:
            print 'TODO'
            return 'Something'
        if output_format == 'xml':
            # construct XML
            root = ET.Element("items")
            for k, v in info.items():
                lanedr = ET.SubElement(root, "lanedr")
                lanedr.set('direction', k.strip())
                for v0 in v:
                    item = ET.SubElement(lanedr, "item")
                    item.set("datetime", v0['datetime'].strftime("%Y-%m-%d %H:%M:%S"))
                    item.set("vol", str(v0['vol']))

            tree = ET.ElementTree(root)
            #    tree.write("test.xml") # write to a temporary file
            return ET.dump(tree) # return an XML string

        elif output_format == 'csv':
            # construct csv
            text = ["datetime,vol,lanedr"]
            for k, v in info.items():
                kk = k.strip()
                for v0 in v:
                    if str(v0['vol']) == 'None':
                        text.append("%s,%s,%s" % (v0['datetime'].strftime("%Y-%m-%d %H:%M:%S"), '0', kk))
                    else:
                        text.append("%s,%s,%s" % (v0['datetime'].strftime("%Y-%m-%d %H:%M:%S"), str(v0['vol']), kk))
            outtext = '\n'.join(t for t in text)
            return outtext


def getcorridor():
    """
    returns the json formatted corridor info string
    """
    cor_data = load_corridors()
    return json.dumps(cor_data)


def query_by_corridor_components(corridor_id, date_time, landir):
    """
    returns the
    :param corridor_id: corridor ID
    :param date_time:
    :return:
    """
    # query data
    DBserver, DBname, UID, PWD, tblname = load_dbsetting_file(db_setting_path)
    connStr = ( r'DRIVER={SQL Server};SERVER=' +
                DBserver + ';DATABASE=' + DBname + ';' +
                'UID=' + UID + ';PWD=' + PWD)

    conn = pyodbc.connect(connStr)

    querystr = "SELECT acisa, VolSum, avg_speed FROM %s WHERE data_datetime = \'%s\'AND ACISA in (%s) AND laneDir = \'%s\'"
    return


# testing command
#print query_by_corridor_group('1', '2013-10-01', '2013-10-31')
# print query_by_acisa('2135', '2013-10-01', '2013-10-31')
