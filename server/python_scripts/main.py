import os
import sys
import re
import json


def get_directory(dir_path="C:/Users/Steve/Desktop"):
    try:
        directory, folders, files = next(os.walk(dir_path, topdown=True))

        stats = dict()
        stats['counts'] = [
            {"name": "files", "value": len(files), 'type': 'base'},
            {"name": "folders", "value": len(folders), 'type': 'base'},
            ]

        # get file types and add to stats.counts
        file_types = get_file_extensions_and_counts(files)
        stats['file types'] = file_types

    except StopIteration:
        def handle_err(err):
            # return err
            raise Exception(err) from None

        handle_err(f'CAN NOT FIND INFORMATION FROM DIRECTORY: {dir_path}')
        return

    # Parse into readable dict.
    return_obj = {
        "directory": directory,
        "folders": folders,
        "files": files,
        "stats": stats,
        }

    # Encode to JSON
    encoded_string = json.dumps(return_obj)
    return encoded_string


def get_file_extensions_and_counts(filenames: list):
    """Converts a list of filenames into a list of dictionaries with format:
        {'name': FILE-EXT.,'value': COUNT-OF-EXTs.}

    :param filenames: list of strings
    :return: List of dictionaries - ex: [{'name': FILE-EXT.,'value': COUNT-OF-EXTs.}, ...]
    """
    filetypes = dict()

    for filename in filenames:
        # Gets the extension from the file name
        try:
            ext = re.search(r'(.)\.\w+$', filename)
            if ext.group():
                ext = ext.group()[1:]
            # print(ext)

            if ext in filetypes.keys():
                filetypes[ext] += 1
            else:
                filetypes[ext] = 1

        except StopIteration:
            pass

    ret_list = name_value_dict(filetypes, 'file_type')
    return ret_list


def name_value_dict(d: dict, t: str = None):
    """Utility function - Converts a dictionary of key value pairs to multiple dictionaries with keys mapped to value of
    "name" and values mapped to value of "value"

    :param d: the dictionary who's key and value will be mapped to values of "name" and "value" respectively
    :param t: adds key "type" with value t to the returning dictionary
    :return: List of dictionaries with keys: "name" & "value"
    """
    return_list = []
    for k, v in d.items():
        # print(k, v)
        temp_dict = {'name': k, 'value': v}

        if t:
            temp_dict['type'] = t

        return_list.append(temp_dict)
    return return_list


if __name__ == "__main__":
    dirArg = sys.argv[1]
    print(get_directory(dirArg))

    # print(get_directory("D:/USERS/Steve"))
