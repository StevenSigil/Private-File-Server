import os
import sys
import json


def get_directory(dir_path="C:/Users/Steve/Desktop"):
    try:
        filenames = next(os.walk(dir_path))  # [directory, [folders], [files]]
        stats = {}

        stats["counts"] = [
            {"name": "files", "value": len(filenames[2])},
            {"name": "folders", "value": len(filenames[1])},
        ]
        stats["TEST"] = [
            {"name": "files", "value": len(filenames[2])},
            # {"name": "folders", "value": len(filenames[1])},
        ]
    except Exception:
        return_err = {"error": "ERROR RETRIEVING DIRECTORY FROM: " + dir_path}
        print(json.dumps(return_err))

        # raise StopIteration(
        #     "\nERROR RETRIEVING DIRECTORY FROM PATH: " + dir_path
        # )

    # Parse into readable dict.
    return_obj = {
        "directory": filenames[0],
        "folders": filenames[1],
        "files": filenames[2],
        "stats": stats,
    }

    # Encode to JSON
    encoded_string = json.dumps(return_obj)
    return encoded_string


if __name__ == "__main__":
    try:
        dirArg = sys.argv[1]
        print(get_directory(dirArg))

        # print(get_directory())
    except Exception:
        raise Exception("\nERROR WHILE LOADING ARGUMENT\n")
