import os
import errno
import json
import sys


def path_hierarchy(path):
    path_save = '/' + path.split('\\', 4)[4].replace('\\', '/')
    hierarchy = {
        'path': path_save,
    }
    try:
        hierarchy['images'] = [
            path_hierarchy(os.path.join(path, contents))
            for contents in os.listdir(path) if
            'temp' not in contents and 'favicon' not in contents and 'title' not in contents
        ]
        names = path.split('\\')
        hierarchy['name'] = names[len(names) - 1]
        del hierarchy['path']
    except OSError as e:
        if e.errno != errno.ENOTDIR:
            raise
    return hierarchy


def path_to_dict(path):
    d = {'name': os.path.basename(path)}
    if os.path.isdir(path):
        d['type'] = "directory"
        d['children'] = [path_to_dict(os.path.join(path, x)) for x in os.listdir(path)]
    else:
        d['type'] = "file"
    return d


if __name__ == '__main__':
    try:
        directory = sys.argv[1]
    except IndexError:
        directory = "D:\\Download\\Touhou\\th-music-video-generator\\images"

    print(json.dumps(path_hierarchy(directory), indent=2, sort_keys=True, ensure_ascii=False))
