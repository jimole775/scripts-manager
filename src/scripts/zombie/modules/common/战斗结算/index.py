import pyautogui
from util.match import get_point
# 根据判断 steps中的1.png是否在当前页面截图中存在，如果存在，就找到 2.png 的坐标，并且调用鼠标的左键进行点击
def execute():

    steps = ['1.png', '2.png']
    # 查找 1.png 是否存在
    img1_location = get_point(steps[0])
    if img1_location:
        # 查找 2.png 的坐标
        img2_location = get_point(steps[1])
        if img2_location:
            # 调用鼠标左键点击 2.png 的位置
            pyautogui.click(img2_location)
            return True
    return False
