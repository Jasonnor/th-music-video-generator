import os
import errno

def path_hierarchy(path):
    path_save = '/' + path.split('\\', 4)[4].replace('\\', '/')
    names = path.split('\\')
    hierarchy = {
        'name': names[len(names) - 1],
        'path': path_save,
        'zcharacter': names[len(names) - 2],
        'zkeyword': names[len(names) - 2],
    }

    try:
        hierarchy['songs'] = [
            path_hierarchy(os.path.join(path, contents))
            for contents in os.listdir(path)
        ]
        del hierarchy['zcharacter']
        del hierarchy['zkeyword']
    except OSError as e:
        if e.errno != errno.ENOTDIR:
            raise

    return hierarchy

def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['type'] = "directory"
        d['children'] = [path_to_dict(os.path.join(path,x)) for x in os.listdir\
(path)]
    else:
        d['type'] = "file"
    return d

if __name__ == '__main__':
    import json
    import sys

    try:
        directory = sys.argv[1]
    except IndexError:
        directory = "D:\\Download\\Touhou\\th-music-video-generator\\audio\\temp"

    print(json.dumps(path_hierarchy(directory), indent=2, sort_keys=True))
    #print(json.dumps(path_to_dict(directory)))